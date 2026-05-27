import { ApiProperty } from '@nestjs/swagger';

import { CONVERSATION_TYPE, PARTICIPANT_ROLE } from '@social-chat/domain';

export class ConversationMemberResponse {
    @ApiProperty()
    userId: string;

    @ApiProperty({ enum: PARTICIPANT_ROLE })
    role: PARTICIPANT_ROLE;

    @ApiProperty()
    joinedAt: Date;
}

export class ConversationResponse {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: CONVERSATION_TYPE })
    type: CONVERSATION_TYPE;

    @ApiProperty({ nullable: true })
    name: string | null;

    @ApiProperty({ type: [ConversationMemberResponse] })
    members: ConversationMemberResponse[];

    @ApiProperty()
    lastActivityAt: Date;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class ParticipantSnapshotResponse {
    @ApiProperty()
    userId: string;

    @ApiProperty()
    displayName: string;

    @ApiProperty({ required: false })
    avatarUrl?: string;
}

/**
 * Inbox listing variant: includes resolved `participants` for direct
 * client rendering (avatar + name without a follow-up user fetch).
 */
export class ConversationListItemResponse extends ConversationResponse {
    @ApiProperty({ type: [ParticipantSnapshotResponse] })
    participants: ParticipantSnapshotResponse[];
}

export class ConversationPageResponse {
    @ApiProperty({ type: [ConversationListItemResponse] })
    items: ConversationListItemResponse[];

    @ApiProperty({ nullable: true, description: 'Opaque cursor. Pass to fetch older page; null when no more.' })
    nextCursor: string | null;

    @ApiProperty()
    hasMore: boolean;
}
