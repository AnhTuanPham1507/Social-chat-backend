import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentAuthorDTO {
    @ApiProperty({ description: 'Author user ID' })
    id: string;

    @ApiProperty({ description: 'Author display name' })
    name: string;

    @ApiPropertyOptional({ description: 'Author avatar URL' })
    avatar?: string;
}

export class ReactionCountsDTO {
    @ApiProperty() like: number;
    @ApiProperty() love: number;
    @ApiProperty() haha: number;
    @ApiProperty() wow: number;
    @ApiProperty() sad: number;
    @ApiProperty() angry: number;
}

export class CommentDTO {
    @ApiProperty({ description: 'Comment ID' })
    id: string;

    @ApiProperty({ description: 'Post ID' })
    postId: string;

    @ApiProperty({ description: 'Author user ID' })
    authorId: string;

    @ApiPropertyOptional({ description: 'Parent comment ID (for replies)' })
    parentCommentId?: string;

    @ApiProperty({ description: 'Comment content' })
    content: string;

    @ApiProperty({ description: 'Attachment keys', type: [String] })
    attachments: string[];

    @ApiProperty({ description: 'Whether the comment has been edited' })
    isEdited: boolean;

    @ApiPropertyOptional({ description: 'When the comment was last edited' })
    editedAt?: Date;

    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date' })
    updatedAt: Date;
}

export class CommentReadResponseDTO {
    @ApiProperty({ description: 'Comment ID' })
    id: string;

    @ApiProperty({ description: 'Post ID' })
    postId: string;

    @ApiProperty({ description: 'Comment author', type: CommentAuthorDTO })
    author: CommentAuthorDTO;

    @ApiPropertyOptional({ description: 'Parent comment ID (for replies)' })
    parentCommentId?: string;

    @ApiProperty({ description: 'Comment content' })
    content: string;

    @ApiProperty({ description: 'Attachment keys', type: [String] })
    attachments: string[];

    @ApiProperty({ description: 'Whether the comment has been edited' })
    isEdited: boolean;

    @ApiPropertyOptional({ description: 'When the comment was last edited' })
    editedAt?: Date;

    @ApiProperty({ description: 'Reaction counts by type', type: ReactionCountsDTO })
    reactionCounts: ReactionCountsDTO;

    @ApiProperty({ description: 'Number of replies' })
    repliesCount: number;

    @ApiProperty({ description: 'Current user reaction type', nullable: true })
    myReaction: string | null;

    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date' })
    updatedAt: Date;
}

export class PaginatedCommentsDTO {
    @ApiProperty({ type: [CommentReadResponseDTO], description: 'List of comments for this page' })
    items: CommentReadResponseDTO[];

    @ApiPropertyOptional({
        description: 'Cursor for next page (comment ID of last item). null when no more pages.',
        nullable: true,
    })
    nextCursor?: string | null;

    @ApiProperty({ description: 'Whether there are more comments after this page' })
    hasMore: boolean;
}
