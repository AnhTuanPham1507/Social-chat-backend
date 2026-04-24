import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { POST_VISIBILITY, REACTION_TYPE } from '@social-chat/domain';

export class ReactionCountsDTO {
    @ApiProperty({ description: 'Number of like reactions' })
    like: number;

    @ApiProperty({ description: 'Number of love reactions' })
    love: number;

    @ApiProperty({ description: 'Number of haha reactions' })
    haha: number;

    @ApiProperty({ description: 'Number of wow reactions' })
    wow: number;

    @ApiProperty({ description: 'Number of sad reactions' })
    sad: number;

    @ApiProperty({ description: 'Number of angry reactions' })
    angry: number;
}

export class PostReactionsDTO {
    @ApiProperty({ type: ReactionCountsDTO, description: 'Reaction counts by type' })
    counts: ReactionCountsDTO;

    @ApiPropertyOptional({
        description: 'Current user\'s reaction on this post, or null if not reacted',
        enum: REACTION_TYPE,
        nullable: true,
    })
    mine: REACTION_TYPE | null;
}

export class SharedOriginalAuthorDTO {
    @ApiProperty({ description: 'Author user ID' })
    id: string;

    @ApiProperty({ description: 'Author display name' })
    displayName: string;

    @ApiPropertyOptional({ description: 'Author avatar URL' })
    avatarUrl?: string;
}

export class SharedOriginalDTO {
    @ApiProperty({ description: 'Original post ID' })
    id: string;

    @ApiProperty({
        description: 'Whether the original post is still visible. When false, content/attachments are intentionally omitted (deleted or private).',
    })
    isAvailable: boolean;

    @ApiPropertyOptional({
        type: SharedOriginalAuthorDTO,
        description: 'Author of the original post. Preserved on tombstones so the UI can render "Bob\'s post is unavailable".',
    })
    author?: SharedOriginalAuthorDTO;

    @ApiPropertyOptional({ description: 'Original post content (only when isAvailable=true)' })
    content?: string;

    @ApiPropertyOptional({
        description: 'Original post attachments (only when isAvailable=true)',
        type: [String],
    })
    attachmentKeys?: string[];

    @ApiPropertyOptional({
        description: 'Original visibility (only when isAvailable=true)',
        enum: POST_VISIBILITY,
    })
    visibility?: POST_VISIBILITY;

    @ApiPropertyOptional({ description: 'Original creation date (only when isAvailable=true)' })
    createdAt?: Date;
}

export class PostDTO {
    @ApiProperty({ description: 'Post ID' })
    id: string;

    @ApiProperty({ description: 'Author user ID' })
    authorId: string;

    @ApiPropertyOptional({ description: 'Post content' })
    content?: string;

    @ApiProperty({ description: 'Post visibility', enum: POST_VISIBILITY })
    visibility: POST_VISIBILITY;

    @ApiProperty({ description: 'Whether the post has been edited' })
    isEdited: boolean;

    @ApiPropertyOptional({ description: 'When the post was last edited' })
    editedAt?: Date;

    @ApiPropertyOptional({ description: 'Original post ID if this is a share' })
    originalPostId?: string;

    @ApiProperty({ description: 'Asset keys attached to the post', type: [String] })
    attachmentKeys: string[];

    @ApiProperty({ type: PostReactionsDTO, description: 'Reaction counts and current user\'s reaction' })
    reactions: PostReactionsDTO;

    @ApiProperty({ description: 'Total number of comments on the post' })
    totalCommentsCount: number;

    @ApiProperty({ description: 'Total number of times this post has been shared' })
    totalSharesCount: number;

    @ApiPropertyOptional({ description: 'Creation date' })
    createdAt?: Date;

    @ApiPropertyOptional({ description: 'Last update date' })
    updatedAt?: Date;

    @ApiPropertyOptional({
        type: SharedOriginalDTO,
        description: 'Embedded snapshot of the original post when this post is a share',
    })
    originalPost?: SharedOriginalDTO;
}

export class PaginatedPostsDTO {
    @ApiProperty({ type: [PostDTO], description: 'List of posts for this page' })
    items: PostDTO[];

    @ApiPropertyOptional({
        description: 'Cursor for next page (post ID of last item). null when no more pages.',
        nullable: true,
    })
    nextCursor?: string | null;

    @ApiProperty({ description: 'Whether there are more posts after this page' })
    hasMore: boolean;
}
