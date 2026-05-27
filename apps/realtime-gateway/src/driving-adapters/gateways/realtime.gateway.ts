import { randomUUID } from 'crypto';

import { Inject, Logger, OnModuleDestroy, UsePipes, ValidationPipe } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { PresenceChangedEvent, TypingEvent, SendMessageCommand, WsPushEvent } from '@social-chat/common';
import { KafkaProducerService, RedisBaseService, REDIS_SERVICE_TOKEN } from '@social-chat/infrastructure';
import {
    AuthUserDto,
    IAccessTokenPayload,
    KeycloakApiClient,
} from '@social-chat/shared-libs';

import {
    IPresenceRepository,
    PresenceMutationResult,
    PRESENCE_REPO_TOKEN,
} from '@application/contracts/presence-repository.contract';
import {
    IUserConversationsCache,
    USER_CONVERSATIONS_CACHE_TOKEN,
} from '@application/contracts/user-conversations-cache.contract';
import { MessagingApiClient } from '../../driven-adapters/messaging-api.client';
import {
    RedisSubscriptionManager,
    WsPushChannel,
} from '../../driven-adapters/redis-subscription-manager';
import { AuthTokenWsDto } from '../dtos/auth-token.ws-dto';
import { ConversationTypingWsDto } from '../dtos/conversation-typing.ws-dto';
import { MessageReadWsDto } from '../dtos/message-read.ws-dto';
import { SendMessageWsDto } from '../dtos/send-message.ws-dto';

type MessageSendingAck = {
    messageId: string;
    gatewayReceivedAt: number;
};

type MessageFailedAck = {
    messageId: string;
    conversationId: string;
    code: 'KAFKA_PUBLISH_FAILED' | 'INTERNAL_ERROR';
    reason: string;
};

type AuthErrorPayload = {
    code: 'TOKEN_EXPIRED' | 'INVALID_TOKEN' | 'TOKEN_USER_MISMATCH';
    reason: string;
};

@WebSocketGateway({
    cors: {
        // Cookies + CORS rule: when credentials are enabled, the browser
        // refuses to send the cookie if Access-Control-Allow-Origin is '*'.
        // We must echo a concrete origin. CLIENT_URL is comma-separated to
        // allow multiple dev origins (e.g. 5000 web, 5001 admin).
        origin: (process.env.CLIENT_URL ?? 'http://localhost:5000').split(','),
        credentials: true,
    },
})
export class RealtimeGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    private readonly _logger = new Logger(RealtimeGateway.name);

    @WebSocketServer()
    private readonly _server: Server;

    // deviceField → pending grace-period timeout handle (Story 7.4)
    private readonly _pendingDisconnects = new Map<string, NodeJS.Timeout>();

    constructor(
        private readonly _keycloakService: KeycloakApiClient,
        private readonly _kafkaProducer: KafkaProducerService,
        private readonly _subManager: RedisSubscriptionManager,
        @Inject(USER_CONVERSATIONS_CACHE_TOKEN)
        private readonly _convCache: IUserConversationsCache,
        private readonly _messagingApi: MessagingApiClient,
        @Inject(PRESENCE_REPO_TOKEN)
        private readonly _presenceRepo: IPresenceRepository,
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redis: RedisBaseService,
    ) { }

    public afterInit(server: Server): void {
        server.use(async (socket, next) => {
            try {
                const token = this._extractToken(socket);
                if (!token) {
                    return next(new Error('Unauthorized: missing token'));
                }

                const payload =
                    await this._keycloakService.verifyToken<IAccessTokenPayload>(token);

                socket.data.user = new AuthUserDto({
                    id: payload.sub,
                    email: payload.email,
                    name: payload.preferred_username,
                    roles: payload.realm_access?.roles ?? [],
                });
                socket.data.tokenExp = payload.exp;

                next();
            } catch {
                next(new Error('Unauthorized: invalid token'));
            }
        });

        this._subManager.setMessageHandler((channel, rawPayload) => {
            this._dispatch(server, channel, rawPayload);
        });

        this._logger.log('Realtime gateway initialized');
    }

    public async handleConnection(socket: Socket): Promise<void> {
        const user = socket.data.user as AuthUserDto | undefined;
        if (!user) {
            this._logger.warn(
                `Connection without user payload; disconnecting socket=${socket.id}`,
            );
            socket.disconnect(true);
            return;
        }

        const { deviceId, tabId } = socket.handshake.auth as Record<string, string>;
        if (!deviceId || !tabId) {
            this._logger.warn(
                `Missing deviceId or tabId in auth; disconnecting socket=${socket.id} userId=${user.id}`,
            );
            socket.disconnect(true);
            return;
        }

        const deviceField = `device_${deviceId}:${tabId}`;
        socket.data.deviceField = deviceField;
        socket.data.attachedChannels = new Set<string>();

        // Cancel any pending grace-period disconnect for this device (Story 7.4).
        // Must happen before heartbeat so we never race a pending offline publish
        // with the incoming online write.
        await this._cancelGrace(user.id, deviceField);

        const userChannel = `user:${user.id}`;
        socket.join(userChannel);
        await this._subManager.attach(userChannel);
        (socket.data.attachedChannels as Set<string>).add(userChannel);

        let convIds: string[] = [];
        try {
            convIds = await this._convCache.findConversationIds(user.id);
        } catch (err) {
            this._logger.error(
                `Failed to load conversations for user=${user.id}: ` +
                `${err instanceof Error ? err.message : err}`,
            );
        }

        for (const convId of convIds) {
            const channel = `conversation:${convId}`;
            socket.join(channel);
            await this._subManager.attach(channel);
            (socket.data.attachedChannels as Set<string>).add(channel);
        }

        try {
            const result = await this._presenceRepo.heartbeat(user.id, deviceField);
            await this._publishPresence(user.id, convIds, result);
        } catch (err) {
            this._logger.error(
                `Presence heartbeat failed on connect userId=${user.id}: ` +
                `${err instanceof Error ? err.message : err}`,
            );
        }

        this._logger.log(
            `Client connected: socket=${socket.id} userId=${user.id} conversations=${convIds.length}`,
        );
    }

    public async handleDisconnect(socket: Socket): Promise<void> {
        const user = socket.data.user as AuthUserDto | undefined;
        const attached = socket.data.attachedChannels as Set<string> | undefined;
        const deviceField = socket.data.deviceField as string | undefined;

        if (attached) {
            for (const channel of attached) {
                await this._subManager.detach(channel);
            }
        }

        // Start grace period instead of immediately marking offline (Story 7.4).
        // After 5 s of silence the user is considered gone; a reconnect or
        // heartbeat on any pod will cancel this window. Awaited so the SET is
        // ordered before any same-device _cancelGrace DEL that might follow.
        if (user && deviceField) {
            await this._startGrace(user.id, deviceField);
        }

        this._logger.log(
            `Client disconnected: socket=${socket.id} userId=${user?.id ?? 'unknown'}`,
        );
    }

    public onModuleDestroy(): void {
        for (const handle of this._pendingDisconnects.values()) {
            clearTimeout(handle);
        }
        this._pendingDisconnects.clear();
    }

    /**
     * Client sends its refreshed access token after calling the REST /auth/refresh
     * endpoint. We re-verify with Keycloak (not just a local exp check) so a
     * revoked token is rejected even if its exp hasn't elapsed yet.
     *
     * Subject must match the connected user — prevents a logged-out tab from
     * swapping in a different user's token over an established socket.
     */
    @SubscribeMessage('auth:token')
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )
    public async handleAuthToken(
        @ConnectedSocket() socket: Socket,
        @MessageBody() dto: AuthTokenWsDto,
    ): Promise<WsResponse<{ ok: true } | AuthErrorPayload>> {
        try {
            const payload =
                await this._keycloakService.verifyToken<IAccessTokenPayload>(dto.token);

            const user = socket.data.user as AuthUserDto;
            if (payload.sub !== user.id) {
                return {
                    event: 'auth:error',
                    data: { code: 'TOKEN_USER_MISMATCH', reason: 'Token subject does not match connected user' },
                };
            }

            socket.data.user = new AuthUserDto({
                id: payload.sub,
                email: payload.email,
                name: payload.preferred_username,
                roles: payload.realm_access?.roles ?? [],
            });
            socket.data.tokenExp = payload.exp;

            return { event: 'auth:refreshed', data: { ok: true } };
        } catch {
            return {
                event: 'auth:error',
                data: { code: 'INVALID_TOKEN', reason: 'Token verification failed' },
            };
        }
    }

    @SubscribeMessage('presence:heartbeat')
    public async handlePresenceHeartbeat(
        @ConnectedSocket() socket: Socket,
    ): Promise<void> {
        const user = socket.data.user as AuthUserDto;
        const deviceField = socket.data.deviceField as string | undefined;
        if (!deviceField) return;

        if (this._isTokenExpired(socket)) {
            socket.emit('auth:error', { code: 'TOKEN_EXPIRED', reason: 'Access token expired; send auth:token to refresh' });
            return;
        }

        try {
            await this._cancelGrace(user.id, deviceField);
            const convIds = await this._convCache.findConversationIds(user.id);
            const result = await this._presenceRepo.heartbeat(user.id, deviceField);
            await this._publishPresence(user.id, convIds, result);
        } catch (err) {
            this._logger.warn(
                `Presence heartbeat failed userId=${user.id}: ` +
                `${err instanceof Error ? err.message : err}`,
            );
        }
    }

    /**
     * Relays a typing-state transition (started|stopped) for one conversation.
     * The gateway is a stateless relay — no server-side timers, no Kafka, no
     * DB — so the wire event mirrors whatever the sender emitted.
     *
     * Receivers treat `typing:started` as a live signal and arm a 3 s client
     * fallback to auto-clear if a `typing:stopped` is lost (sender crash, tab
     * close, network drop). Senders should emit `stopped` on input-empty and
     * post-send so receivers clear immediately instead of waiting for the
     * fallback timeout.
     *
     * Membership is validated via the socket's attachedChannels: a socket can
     * only be in a conversation room if it joined during handleConnection or a
     * conversation:added event — preventing typing-injection from non-members.
     */
    @SubscribeMessage('conversation:typing')
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )
    public async handleConversationTyping(
        @ConnectedSocket() socket: Socket,
        @MessageBody() dto: ConversationTypingWsDto,
    ): Promise<void> {
        const user = socket.data.user as AuthUserDto;
        const attached = socket.data.attachedChannels as Set<string> | undefined;
        const channel = `conversation:${dto.conversationId}`;

        if (this._isTokenExpired(socket)) {
            socket.emit('auth:error', { code: 'TOKEN_EXPIRED', reason: 'Access token expired; send auth:token to refresh' });
            return;
        }

        if (!attached?.has(channel)) return;

        const event: TypingEvent = {
            event: dto.state === 'stopped' ? 'typing:stopped' : 'typing:started',
            conversationId: dto.conversationId,
            userId: user.id,
        };

        await this._redis.publish(channel, JSON.stringify(event));
    }

    /**
     * Recipient client tells us "I've read up to messageId X in conversation C."
     *
     * Fire-and-forget by design: the client does not need a server response
     * because read receipts are best-effort — offline-recovery via the bulk
     * `participant-states` fetch heals any dropped ack. Awaiting the HTTP
     * round-trip would just stall the client's WS event loop for no UX benefit.
     */
    @SubscribeMessage('message:read')
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )
    public handleMessageRead(
        @ConnectedSocket() socket: Socket,
        @MessageBody() dto: MessageReadWsDto,
    ): void {
        if (this._isTokenExpired(socket)) {
            socket.emit('auth:error', { code: 'TOKEN_EXPIRED', reason: 'Access token expired; send auth:token to refresh' });
            return;
        }

        const user = socket.data.user as AuthUserDto;

        this._messagingApi
            .ackRead(user.id, dto.conversationId, dto.lastReadMessageId)
            .catch((err) => {
                this._logger.warn(
                    `Read ack failed userId=${user.id} convId=${dto.conversationId}: ` +
                    `${err instanceof Error ? err.message : err}`,
                );
            });
    }

    @SubscribeMessage('message:send')
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )
    public async handleSendMessage(
        @ConnectedSocket() socket: Socket,
        @MessageBody() dto: SendMessageWsDto,
    ): Promise<WsResponse<MessageSendingAck | MessageFailedAck | AuthErrorPayload>> {
        if (this._isTokenExpired(socket)) {
            return {
                event: 'auth:error',
                data: { code: 'TOKEN_EXPIRED', reason: 'Access token expired; send auth:token to refresh' },
            };
        }

        const user = socket.data.user as AuthUserDto;
        const gatewayReceivedAt = Date.now();

        const command = new SendMessageCommand({
            messageId: dto.messageId,
            conversationId: dto.conversationId,
            senderId: user.id,
            content: dto.content ?? '',
            attachmentKeys: dto.attachmentKeys,
            clientSentAt: dto.clientSentAt,
            gatewayReceivedAt,
            correlationId: randomUUID(),
        });

        try {
            await this._kafkaProducer.publish(
                SendMessageCommand.TOPIC,
                command.conversationId,
                command,
            );
            return {
                event: 'message:sending',
                data: { messageId: dto.messageId, gatewayReceivedAt },
            };
        } catch (err) {
            this._logger.error(
                `Kafka publish failed for messageId=${dto.messageId}: ${err instanceof Error ? err.message : err}`,
            );
            return {
                event: 'message:failed',
                data: {
                    messageId: dto.messageId,
                    conversationId: dto.conversationId,
                    code: 'KAFKA_PUBLISH_FAILED',
                    reason: 'Publish failed; client may retry with same messageId',
                },
            };
        }
    }

    private _isTokenExpired(socket: Socket): boolean {
        const exp = socket.data.tokenExp as number | undefined;
        if (!exp) return true;
        return Date.now() >= exp * 1000;
    }

    private async _publishPresence(
        userId: string,
        convIds: string[],
        result: PresenceMutationResult,
    ): Promise<void> {
        if (!result.transitioned) {
            this._logger.debug(
                `Presence transition not needed userId=${userId}`,
            );
            return;
        };

        const event: PresenceChangedEvent = {
            event: 'presence:changed',
            userId,
            status: result.status,
            lastSeenAt: result.lastSeenAt?.getTime() ?? null,
        };
        const payload = JSON.stringify(event);

        await Promise.all(
            convIds.map((id) => this._redis.publish(`conversation:${id}`, payload)),
        );
    }

    /**
     * Start a 5-second grace window before marking a device offline.
     *
     * Two-layer cancellation (Story 7.4):
     *   1. In-memory clearTimeout — cancels immediately on same-pod reconnect,
     *      avoiding a wasted Redis round-trip.
     *   2. Redis key `presence:grace:{userId}:{deviceField}` — the timer
     *      callback uses DEL-as-claim: if DEL returns 0, a reconnect on another
     *      pod already cancelled us, so we skip the offline publish. This
     *      eliminates cross-pod flicker without requiring sticky sessions.
     *
     * TTL is intentionally much larger than the 5 s timer: it is a safety
     * backstop for pod crash, NOT the grace duration. If the TTL were ~5 s,
     * Redis would race the JS timer — the key could expire microseconds before
     * the callback runs, DEL would return 0, and we would silently skip the
     * offline publish (user stuck "online" forever).
     *
     * The SET must be awaited so it lands at Redis BEFORE any _cancelGrace DEL
     * a fast same-device reconnect might fire — otherwise SET-after-DEL leaves
     * an orphan key that the timer claims and wrongly publishes offline.
     *
     * If a timer already exists for this deviceField (duplicate _startGrace
     * without an intervening _cancelGrace), we replace it cleanly instead of
     * leaking the previous setTimeout handle.
     */
    private async _startGrace(userId: string, deviceField: string): Promise<void> {
        const existing = this._pendingDisconnects.get(deviceField);
        if (existing) {
            clearTimeout(existing);
        }

        const graceKey = `presence:grace:${userId}:${deviceField}`;

        try {
            await this._redis.getClient().set(graceKey, '1', 'EX', 30);
        } catch (err) {
            this._logger.warn(
                `Failed to set grace key userId=${userId}: ${err instanceof Error ? err.message : err}`,
            );
        }

        const handle = setTimeout(() => {
            this._pendingDisconnects.delete(deviceField);
            this._executeGracePeriodDisconnect(userId, deviceField, graceKey).catch((err) => {
                this._logger.error(
                    `Grace period disconnect failed userId=${userId}: ${err instanceof Error ? err.message : err}`,
                );
            });
        }, 5_000);

        this._pendingDisconnects.set(deviceField, handle);
    }

    private async _cancelGrace(userId: string, deviceField: string): Promise<void> {
        const pending = this._pendingDisconnects.get(deviceField);
        if (pending) {
            clearTimeout(pending);
            this._pendingDisconnects.delete(deviceField);
        }
        const graceKey = `presence:grace:${userId}:${deviceField}`;
        await this._redis.getClient().del(graceKey);
    }

    private async _executeGracePeriodDisconnect(
        userId: string,
        deviceField: string,
        graceKey: string,
    ): Promise<void> {
        // DEL-as-claim: whoever deletes the key owns the offline publish.
        // Returns 0 if a reconnect on any pod already cancelled this window.
        const deleted = await this._redis.getClient().del(graceKey);
        if (deleted === 0) {
            this._logger.debug(
                `Grace period cancelled for userId=${userId} deviceField=${deviceField}`,
            );
            return;
        }

        let convIds: string[] = [];
        try {
            convIds = await this._convCache.findConversationIds(userId);
        } catch {
            // best-effort: publish to whatever we can resolve
        }
        const result = await this._presenceRepo.disconnect(userId, deviceField);
        await this._publishPresence(userId, convIds, result);

        this._logger.debug(
            `Grace period disconnect completed userId=${userId} deviceField=${deviceField}`,
        );
    }

    /**
     * Sole entry point for Redis-arriving WS push messages. Two paths:
     *
     *   user:{U}        → may be a membership-change event (act on it locally
     *                     before forwarding), then forward to the user:{U}
     *                     socket.io room
     *   conversation:{C} → forward straight to the conversation:{C} room
     *
     * The socket.io rooms here are POD-LOCAL because we are NOT using the
     * socket.io Redis adapter — Redis pub/sub did the cross-pod routing
     * already; this final emit only reaches sockets terminated on this pod.
     */
    private _dispatch(server: Server, channel: WsPushChannel, rawPayload: string): void {
        let envelope: WsPushEvent;
        try {
            envelope = JSON.parse(rawPayload) as WsPushEvent;
        } catch (err) {
            this._logger.warn(
                `Failed to parse WS push payload on ${JSON.stringify(channel)}: ` +
                `${err instanceof Error ? err.message : err}`,
            );
            return;
        }

        if (!envelope || typeof envelope.event !== 'string') {
            this._logger.warn(
                `WS push envelope missing 'event' field on ${JSON.stringify(channel)}`,
            );
            return;
        }

        if (channel.type === 'user') {
            if (envelope.event === 'conversation:added') {
                this._handleConversationAdded(
                    server,
                    channel.userId,
                    envelope.conversationId,
                ).catch((err) =>
                    this._logger.error(
                        `conversation:added side-effect failed: ${err instanceof Error ? err.message : err}`,
                    ),
                );
            } else if (envelope.event === 'conversation:removed') {
                this._handleConversationRemoved(
                    server,
                    channel.userId,
                    envelope.conversationId,
                ).catch((err) =>
                    this._logger.error(
                        `conversation:removed side-effect failed: ${err instanceof Error ? err.message : err}`,
                    ),
                );
            }
            this._forwardToRoom(server, `user:${channel.userId}`, envelope);
        } else {
            this._forwardToRoom(
                server,
                `conversation:${channel.conversationId}`,
                envelope,
            );
        }
    }

    private _forwardToRoom(server: Server, room: string, envelope: WsPushEvent): void {
        const { event, ...payload } = envelope;
        server.to(room).emit(event, payload);
    }

    private async _handleConversationAdded(
        server: Server,
        userId: string,
        conversationId: string,
    ): Promise<void> {
        const channel = `conversation:${conversationId}`;
        const sockets = await server.in(`user:${userId}`).fetchSockets();
        for (const sock of sockets) {
            sock.join(channel);
            const attached = sock.data.attachedChannels as Set<string> | undefined;
            attached?.add(channel);
            await this._subManager.attach(channel);
        }
    }

    private async _handleConversationRemoved(
        server: Server,
        userId: string,
        conversationId: string,
    ): Promise<void> {
        const channel = `conversation:${conversationId}`;
        const sockets = await server.in(`user:${userId}`).fetchSockets();
        for (const sock of sockets) {
            sock.leave(channel);
            const attached = sock.data.attachedChannels as Set<string> | undefined;
            attached?.delete(channel);
            await this._subManager.detach(channel);
        }
    }

    /**
     * Pulls the JWT from the WS handshake. Two sources, in priority order:
     *
     *   1. handshake.auth.token  — explicit, used by tests, mobile, and any
     *      client that can hold the token in memory.
     *   2. accessToken cookie    — used by the web client, where the token
     *      is HttpOnly and the JS layer cannot see it. The browser attaches
     *      cookies to the WS upgrade request automatically when the socket
     *      is opened with `withCredentials: true` against the same eTLD+1.
     *
     * The cookie header is RFC 6265: `name=value; name2=value2`. JWTs use
     * base64url so the value contains no `;` or unencoded `=` mid-string —
     * a literal split is safe and avoids a runtime dep.
     */
    private _extractToken(socket: Socket): string | null {
        const fromAuth = socket.handshake.auth?.token;
        if (typeof fromAuth === 'string' && fromAuth.length > 0) {
            return fromAuth;
        }

        const cookieHeader = socket.handshake.headers.cookie;
        if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) {
            return null;
        }

        for (const part of cookieHeader.split(';')) {
            const eq = part.indexOf('=');
            if (eq < 0) continue;
            const name = part.slice(0, eq).trim();
            if (name === 'accessToken') {
                return part.slice(eq + 1).trim();
            }
        }
        return null;
    }
}
