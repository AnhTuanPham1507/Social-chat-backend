import { Inject, Injectable } from '@nestjs/common';

import {
    PRESENCE_LUA_SCRIPT,
    PRESENCE_OPERATION,
    PRESENCE_TTL_MS,
    RedisBaseService,
    REDIS_SERVICE_TOKEN,
} from '@social-chat/infrastructure';

import {
    IPresenceReadRepository,
    UserPresenceResult,
} from '@application/contracts/presence-repository.contract';

@Injectable()
export class PresenceReadRedisAdapter implements IPresenceReadRepository {
    constructor(
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redis: RedisBaseService,
    ) {}

    public async getBatch(userIds: string[]): Promise<UserPresenceResult[]> {
        if (userIds.length === 0) return [];

        const now = Date.now();
        const client = this._redis.getClient();

        // Run prune-and-read Lua for each user in parallel.
        // Each call is atomic; running them in parallel (Promise.all) is safe
        // because each operates on a distinct HASH key.
        const results = await Promise.all(
            userIds.map((userId) =>
                (client.eval(
                    PRESENCE_LUA_SCRIPT,
                    1,
                    `presence:${userId}`,
                    PRESENCE_OPERATION.READ,
                    '',
                    now.toString(),
                    PRESENCE_TTL_MS.toString(),
                ) as Promise<[string, string, string]>).then((raw) => ({
                    userId,
                    status:     raw[0] === 'true',
                    lastSeenAt: raw[1] === '0' ? null : new Date(parseInt(raw[1], 10)),
                })),
            ),
        );

        return results;
    }
}
