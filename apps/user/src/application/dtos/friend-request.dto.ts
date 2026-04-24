import { FRIEND_REQUEST_STATUS } from '@social-chat/domain';

export class FriendRequest {
    id: string;
    senderId: string;
    receiverId: string;
    status: FRIEND_REQUEST_STATUS;
    createdAt: Date;
    updatedAt: Date;
}

export interface SendFriendRequestInput {
    senderId: string;
    receiverId: string;
}

export enum FriendRequestAction {
    ACCEPT = 'accept',
    DECLINE = 'decline',
}

export interface RespondFriendRequestInput {
    requestId: string;
    currentUserId: string;
    action: FriendRequestAction;
}
