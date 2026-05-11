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
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDMInput {
    memberIds: string[];
}

export interface CreateGroupInput {
    name: string;
    memberIds: string[];
}
