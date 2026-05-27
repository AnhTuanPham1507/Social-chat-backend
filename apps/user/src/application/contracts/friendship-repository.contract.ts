import { FriendshipEntity } from '@social-chat/domain';
import { FriendItem } from '../dtos/friendship.dto';

export const FRIENDSHIP_REPO_TOKEN = Symbol('FRIENDSHIP_REPO_TOKEN');

export interface MutualFriendCandidate {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    mutualFriendsCount: number;
    adamicAdarScore: number;
    interests: string[];
}

export interface RandomUserCandidate {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
}

export interface IFriendshipRepository {
    findFriendsByUserId(
        userId: string,
        options: { page: number; limit: number; sortBy: 'name' | 'friendshipDate' },
    ): Promise<{ data: FriendItem[]; total: number }>;
    findBetween(userId: string, friendId: string): Promise<FriendshipEntity | null>;
    createFriendshipPair(rowA: FriendshipEntity, rowB: FriendshipEntity): Promise<void>;
    deleteBetween(userId: string, friendId: string): Promise<void>;
    blockBetween(blocker: FriendshipEntity, blocked: FriendshipEntity): Promise<void>;
    existsBlockBetween(userIdA: string, userIdB: string): Promise<boolean>;
    findBlockBetween(blockerId: string, blockedId: string): Promise<FriendshipEntity | null>;
    deleteBlockBetween(blockerId: string, blockedId: string): Promise<void>;
    findMutualFriendCandidates(userId: string): Promise<MutualFriendCandidate[]>;
    /**
     * Returns mutual-friend count for each candidate against the current user.
     * Candidates with zero mutuals are absent from the map.
     */
    getMutualFriendsCountsFor(
        currentUserId: string,
        candidateIds: string[],
    ): Promise<Map<string, number>>;
    findRandomUsersExcluding(
        userId: string,
        limit: number,
        excludeIds: string[],
    ): Promise<RandomUserCandidate[]>;
    getAllUserIds(): Promise<string[]>;
    findAllFriendIds(userId: string): Promise<string[]>;
}
