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
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
