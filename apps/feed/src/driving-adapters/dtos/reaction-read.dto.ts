import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CONTENT_TYPE, REACTION_TYPE } from '@social-chat/domain';

export class ReactionAuthorDTO {
    @ApiProperty({ description: 'User ID' })
    id: string;

    @ApiProperty({ description: 'User full name' })
    name: string;

    @ApiPropertyOptional({ description: 'User avatar URL' })
    avatar?: string;
}

export class ReactionReadDTO {
    @ApiProperty({ description: 'Reaction ID' })
    id: string;

    @ApiProperty({ description: 'Content ID (post or comment)' })
    contentId: string;

    @ApiProperty({ description: 'Content type', enum: CONTENT_TYPE })
    contentType: CONTENT_TYPE;

    @ApiProperty({ description: 'Reaction type', enum: REACTION_TYPE })
    reaction: REACTION_TYPE;

    @ApiProperty({ description: 'Author information', type: ReactionAuthorDTO })
    author: ReactionAuthorDTO;

    @ApiProperty({ description: 'When the reaction was created' })
    createdAt: Date;
}

export class PaginatedReactionsDTO {
    @ApiProperty({ type: [ReactionReadDTO], description: 'List of reactions' })
    items: ReactionReadDTO[];

    @ApiPropertyOptional({ description: 'Cursor for next page, null if no more items' })
    nextCursor?: string | null;

    @ApiProperty({ description: 'Whether there are more items' })
    hasMore: boolean;
}
