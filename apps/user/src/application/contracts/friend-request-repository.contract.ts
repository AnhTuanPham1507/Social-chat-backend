import { FriendRequestEntity } from '@social-chat/domain';

export const FRIEND_REQUEST_REPO_TOKEN = Symbol('FRIEND_REQUEST_REPO_TOKEN');

export interface PendingRequestItem {
    id: string;
    otherUserId: string;
    otherUserName: string;
    otherUserAvatarUrl: string | null;
    direction: 'sent' | 'received';
    createdAt: Date;
}

export interface IFriendRequestRepository {
    insert(friendRequest: FriendRequestEntity): Promise<void>;
    findById(id: string): Promise<FriendRequestEntity | null>;
    update(friendRequest: FriendRequestEntity): Promise<void>;
    existsPendingBetween(senderId: string, receiverId: string): Promise<boolean>;
    declinePendingBetween(userIdA: string, userIdB: string): Promise<void>;
    findPendingBetween(userIdA: string, userIdB: string): Promise<FriendRequestEntity | null>;
    findPendingForUser(userId: string): Promise<PendingRequestItem[]>;
    delete(id: string): Promise<void>;
}
