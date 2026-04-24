import { ApiProperty } from '@nestjs/swagger';
import { CONTENT_TYPE, REACTION_TYPE } from '@social-chat/domain';

export class ReactionDTO {
    @ApiProperty({ description: 'Reaction ID' })
    id: string;

    @ApiProperty({ description: 'Content ID (post or comment)' })
    contentId: string;

    @ApiProperty({ description: 'Content type', enum: CONTENT_TYPE })
    contentType: CONTENT_TYPE;

    @ApiProperty({ description: 'User ID who reacted' })
    userId: string;

    @ApiProperty({ description: 'Reaction type', enum: REACTION_TYPE })
    type: REACTION_TYPE;

    @ApiProperty({ description: 'When the reaction was created' })
    createdAt: Date;
}
