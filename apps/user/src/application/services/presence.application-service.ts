import { Inject, Injectable } from '@nestjs/common';

import {
    IPresenceReadRepository,
    PRESENCE_READ_REPO_TOKEN,
    UserPresenceResult,
} from '@application/contracts/presence-repository.contract';
import {
    FRIENDSHIP_REPO_TOKEN,
    IFriendshipRepository,
} from '@application/contracts/friendship-repository.contract';

export const PRESENCE_APP_SERVICE_TOKEN = Symbol('PRESENCE_APP_SERVICE_TOKEN');

export interface IPresenceApplicationService {
    getFriendsPresence(currentUserId: string, ids?: string[]): Promise<UserPresenceResult[]>;
}

@Injectable()
export class PresenceApplicationService implements IPresenceApplicationService {
    constructor(
        @Inject(PRESENCE_READ_REPO_TOKEN)
        private readonly _presenceRepo: IPresenceReadRepository,
        @Inject(FRIENDSHIP_REPO_TOKEN)
        private readonly _friendshipRepo: IFriendshipRepository,
    ) {}

    public async getFriendsPresence(
        currentUserId: string,
        ids?: string[],
    ): Promise<UserPresenceResult[]> {
        let targetIds: string[];

        if (ids && ids.length > 0) {
            // Restrict to confirmed friends only — prevents probing arbitrary users.
            const friendIds = new Set(await this._friendshipRepo.findAllFriendIds(currentUserId));
            targetIds = ids.filter((id) => friendIds.has(id));
        } else {
            targetIds = await this._friendshipRepo.findAllFriendIds(currentUserId);
        }

        if (targetIds.length === 0) return [];

        return this._presenceRepo.getBatch(targetIds);
    }
}
