import { CONVERSATION_TYPE, PARTICIPANT_ROLE } from '@social-chat/domain';

export interface ConversationMemberDTO {
    userId: string;
    role: PARTICIPANT_ROLE;
    joinedAt: Date;
}

export class ConversationDTO {
    id: string;
    type: CONVERSATION_TYPE;
    name: string | null;
    members: ConversationMemberDTO[];
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ParticipantSnapshotDTO {
    userId: string;
    displayName: string;
    avatarUrl?: string;
}

/**
 * Inbox listing variant of ConversationDTO. Includes `participants`,
 * resolved from the messaging-local users_view (CDC projection from the
 * user service). Missing entries simply omit the snapshot — eventual
 * consistency means a brand-new conversation may have skeleton info
 * until CDC catches up.
 */
export class ConversationListItemDTO {
    id: string;
    type: CONVERSATION_TYPE;
    name: string | null;
    members: ConversationMemberDTO[];
    participants: ParticipantSnapshotDTO[];
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export class ConversationPageDTO {
    items: ConversationListItemDTO[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface ListConversationsInput {
    cursor?: string;
    limit?: number;
}

export interface CreateDMInput {
    memberIds: string[];
}

export interface CreateGroupInput {
    name: string;
    memberIds: string[];
}
