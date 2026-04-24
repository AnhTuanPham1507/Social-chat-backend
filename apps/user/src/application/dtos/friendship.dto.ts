export class FriendItem {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    friendshipDate: Date;
}

export interface GetFriendsInput {
    currentUserId: string;
    page: number;
    limit: number;
    sortBy: 'name' | 'friendshipDate';
}

export interface UnfriendInput {
    currentUserId: string;
    targetUserId: string;
}

export interface BlockUserInput {
    blockerId: string;
    blockedId: string;
}

export interface UnblockUserInput {
    unblockerId: string;
    unblockedId: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
