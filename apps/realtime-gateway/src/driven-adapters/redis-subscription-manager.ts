import {
    Inject,
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { Cluster, Redis } from 'ioredis';

import { RedisBaseService, REDIS_SERVICE_TOKEN } from '@social-chat/infrastructure';

export type WsPushChannel =
    | { type: 'user'; userId: string }
    | { type: 'conversation'; conversationId: string };

export type WsPushMessageHandler = (
    channel: WsPushChannel,
    rawPayload: string,
) => void;

/**
 * Per-pod ref-counted Redis pub/sub subscriber.
 *
 * Channel-agnostic: callers pass full channel names (`user:{id}` /
 * `conversation:{id}`). The manager tracks one ref-count per channel and
 * issues SUBSCRIBE/UNSUBSCRIBE on 0↔1 transitions only.
 *
 * Why a dedicated subscriber connection: once an ioredis client issues
 * SUBSCRIBE, it transitions into subscriber mode and can no longer
 * execute normal commands. We `duplicate()` the shared client so the
 * original stays available for non-pub/sub work.
 *
 * What we accept losing: a message published in the window between
 * `attach()` (subscribe in flight) and the SUBSCRIBE landing on Redis is
 * dropped. The Mongo notifications layer (story 6.4-B) is the safety
 * net for this exact case.
 */
@Injectable()
export class RedisSubscriptionManager implements OnModuleInit, OnModuleDestroy {
    private readonly _logger = new Logger(RedisSubscriptionManager.name);
    private readonly _counts = new Map<string, number>();
    private _subscriber: Redis | Cluster | null = null;
    private _messageHandler: WsPushMessageHandler | null = null;

    constructor(
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redisBase: RedisBaseService,
    ) {}

    public onModuleInit(): void {
        this._subscriber = this._redisBase.getClient().duplicate();
        this._subscriber.on('message', (channel: string, message: string) => {
            const parsed = this._parseChannel(channel);
            if (!parsed) {
                this._logger.warn(`Unexpected channel: ${channel}`);
                return;
            }
            if (!this._messageHandler) {
                this._logger.warn(
                    `No message handler registered; dropping message for ${channel}`,
                );
                return;
            }
            try {
                this._messageHandler(parsed, message);
            } catch (err) {
                this._logger.error(
                    `WS push handler threw for ${channel}: ` +
                        `${err instanceof Error ? err.message : err}`,
                );
            }
        });
        this._logger.log('Subscriber connection established');
    }

    public async onModuleDestroy(): Promise<void> {
        if (this._subscriber) {
            await this._subscriber.quit();
            this._subscriber = null;
        }
    }

    public setMessageHandler(handler: WsPushMessageHandler): void {
        this._messageHandler = handler;
    }

    public async attach(channel: string): Promise<void> {
        if (!this._subscriber) {
            throw new Error('RedisSubscriptionManager not initialized');
        }
        const prev = this._counts.get(channel) ?? 0;
        this._counts.set(channel, prev + 1);
        if (prev === 0) {
            await this._subscriber.subscribe(channel);
            this._logger.debug(`SUBSCRIBE ${channel} (0 -> 1)`);
        }
    }

    public async detach(channel: string): Promise<void> {
        if (!this._subscriber) {
            return;
        }
        const prev = this._counts.get(channel) ?? 0;
        if (prev === 0) {
            this._logger.warn(
                `detach called for ${channel} with refcount 0 — ignoring`,
            );
            return;
        }
        const next = prev - 1;
        if (next === 0) {
            this._counts.delete(channel);
            await this._subscriber.unsubscribe(channel);
            this._logger.debug(`UNSUBSCRIBE ${channel} (1 -> 0)`);
        } else {
            this._counts.set(channel, next);
        }
    }

    private _parseChannel(channel: string): WsPushChannel | null {
        if (channel.startsWith('user:')) {
            return { type: 'user', userId: channel.slice('user:'.length) };
        }
        if (channel.startsWith('conversation:')) {
            return {
                type: 'conversation',
                conversationId: channel.slice('conversation:'.length),
            };
        }
        return null;
    }
}
