import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { POST_VISIBILITY } from '@social-chat/domain';

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

    @ApiProperty({ description: 'Number of reactions' })
    reactionsCount: number;

    @ApiProperty({ description: 'Number of comments' })
    commentsCount: number;

    @ApiProperty({ description: 'Number of shares' })
    sharesCount: number;

    @ApiProperty({ description: 'Asset keys attached to the post', type: [String] })
    attachmentKeys: string[];

    @ApiPropertyOptional({ description: 'Creation date' })
    createdAt?: Date;

    @ApiPropertyOptional({ description: 'Last update date' })
    updatedAt?: Date;
}
