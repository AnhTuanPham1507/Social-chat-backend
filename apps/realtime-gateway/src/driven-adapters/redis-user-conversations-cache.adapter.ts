import { Inject, Injectable } from '@nestjs/common';

import { RedisBaseService, REDIS_SERVICE_TOKEN } from '@social-chat/infrastructure';

import { IUserConversationsCache } from '@application/contracts/user-conversations-cache.contract';

@Injectable()
export class RedisUserConversationsCache implements IUserConversationsCache {
    constructor(
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redis: RedisBaseService,
    ) {}

    public async findConversationIds(userId: string): Promise<string[]> {
        return this._redis.smembers(`user:${userId}:conversations`);
    }
}
