import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ConversationAddedEvent } from '@social-chat/common';
import { ConversationCreatedEvent } from '@social-chat/domain';
import { RedisBaseService, REDIS_SERVICE_TOKEN } from '@social-chat/infrastructure';

import {
    IWsPushPublisher,
    WS_PUSH_PUBLISHER_TOKEN,
} from '@application/contracts/ws-push-publisher.contract';

/**
 * Owns the per-user conversation cache used by realtime-gateway to know
 * which conversation channels to subscribe to on connect — plus the
 * mid-session push that lets already-connected sockets subscribe to the
 * new conversation without reconnecting.
 *
 * Cache key: `user:{userId}:conversations` (Redis SET of conversationIds)
 *
 * Ordering matters: SADD the cache FIRST, THEN publish the
 * `conversation:added` event. A gateway pod that receives the event and
 * does a defensive SMEMBERS to confirm will see consistent state.
 *
 * TODO(stories 6.11 / 6.12): add symmetric listeners on a future
 * MemberAddedEvent and MemberRemovedEvent for groups.
 */
@Injectable()
export class ConversationMembershipListener {
    private readonly _logger = new Logger(ConversationMembershipListener.name);

    constructor(
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redis: RedisBaseService,
        @Inject(WS_PUSH_PUBLISHER_TOKEN)
        private readonly _wsPushPublisher: IWsPushPublisher,
    ) {}

    @OnEvent(ConversationCreatedEvent.EVENT_NAME)
    public async handle(event: ConversationCreatedEvent): Promise<void> {
        try {
            await Promise.all(
                event.memberIds.map((userId) =>
                    this._redis.sadd(
                        `user:${userId}:conversations`,
                        event.conversationId,
                    ),
                ),
            );
        } catch (err) {
            this._logger.error(
                `Failed to seed conversation cache for ${event.conversationId}: ` +
                    `${err instanceof Error ? err.message : err}`,
            );
            return;
        }

        const wsEvent: ConversationAddedEvent = {
            event: 'conversation:added',
            conversationId: event.conversationId,
        };
        await Promise.all(
            event.memberIds.map((userId) =>
                this._wsPushPublisher.publishToUser(userId, wsEvent),
            ),
        );
    }
}
