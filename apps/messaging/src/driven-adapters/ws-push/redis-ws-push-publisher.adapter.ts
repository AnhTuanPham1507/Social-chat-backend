import { Inject, Injectable, Logger } from '@nestjs/common';

import { WsPushEvent } from '@social-chat/common';
import { RedisBaseService, REDIS_SERVICE_TOKEN } from '@social-chat/infrastructure';

import { IWsPushPublisher } from '@application/contracts/ws-push-publisher.contract';

@Injectable()
export class RedisWsPushPublisher implements IWsPushPublisher {
    private readonly _logger = new Logger(RedisWsPushPublisher.name);

    constructor(
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redis: RedisBaseService,
    ) {}

    public publishToUser(userId: string, event: WsPushEvent): Promise<void> {
        return this._publish(`user:${userId}`, event);
    }

    public publishToConversation(conversationId: string, event: WsPushEvent): Promise<void> {
        return this._publish(`conversation:${conversationId}`, event);
    }

    private async _publish(channel: string, event: WsPushEvent): Promise<void> {
        try {
            await this._redis.publish(channel, JSON.stringify(event));
        } catch (err) {
            // Fire-and-forget contract: log and swallow. Offline-recoverability
            // layer (6.4-B) is the safety net.
            this._logger.error(
                `Redis publish failed channel=${channel} event=${event.event}: ` +
                    `${err instanceof Error ? err.message : err}`,
            );
        }
    }
}
