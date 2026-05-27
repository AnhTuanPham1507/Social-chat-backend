import { Inject, Injectable } from '@nestjs/common';

import {
    PRESENCE_LUA_SCRIPT,
    PRESENCE_OPERATION,
    PRESENCE_TTL_MS,
    PresenceOperation,
    RedisBaseService,
    REDIS_SERVICE_TOKEN,
} from '@social-chat/infrastructure';

import {
    IPresenceRepository,
    PresenceMutationResult,
} from '@application/contracts/presence-repository.contract';

@Injectable()
export class PresenceRedisAdapter implements IPresenceRepository {
    constructor(
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redis: RedisBaseService,
    ) {}

    public heartbeat(userId: string, deviceField: string): Promise<PresenceMutationResult> {
        return this._eval(userId, PRESENCE_OPERATION.HEARTBEAT, deviceField);
    }

    public disconnect(userId: string, deviceField: string): Promise<PresenceMutationResult> {
        return this._eval(userId, PRESENCE_OPERATION.DISCONNECT, deviceField);
    }

    public logoutDevice(userId: string, deviceIdPrefix: string): Promise<PresenceMutationResult> {
        return this._eval(userId, PRESENCE_OPERATION.LOGOUT_DEVICE, deviceIdPrefix);
    }

    private async _eval(
        userId: string,
        op: PresenceOperation,
        target: string,
    ): Promise<PresenceMutationResult> {
        const raw = (await this._redis.getClient().eval(
            PRESENCE_LUA_SCRIPT,
            1,
            `presence:${userId}`,
            op,
            target,
            Date.now().toString(),
            PRESENCE_TTL_MS.toString(),
        )) as [string, string, string];

        return {
            status:      raw[0] === 'true',
            lastSeenAt:  raw[1] === '0' ? null : new Date(parseInt(raw[1], 10)),
            transitioned: raw[2] === '' ? null : (raw[2] as 'online' | 'offline'),
        };
    }
}
