import { PostDTO as PostAppDTO } from '@application/dtos/post.dto';
import { PostDTO, SharedOriginalAuthorDTO, SharedOriginalDTO } from '../dtos/post.dto';

export class PostMapper {
    static fromAppModelToDTO(post: PostAppDTO): PostDTO {
        const dto = new PostDTO();
        dto.id = post.id;
        dto.authorId = post.authorId;
        dto.content = post.content;
        dto.visibility = post.visibility;
        dto.isEdited = post.isEdited;
        dto.editedAt = post.editedAt;
        dto.originalPostId = post.originalPostId;
        dto.attachmentKeys = post.attachmentKeys;
        dto.reactions = {
            counts: post.reactions.counts,
            mine: post.reactions.mine,
        };
        dto.totalCommentsCount = post.totalCommentsCount;
        dto.totalSharesCount = post.totalSharesCount;
        dto.createdAt = post.createdAt;
        dto.updatedAt = post.updatedAt;

        if (post.originalPost) {
            const original = new SharedOriginalDTO();
            original.id = post.originalPost.id;
            original.isAvailable = post.originalPost.isAvailable;
            if (post.originalPost.author) {
                const author = new SharedOriginalAuthorDTO();
                author.id = post.originalPost.author.id;
                author.displayName = post.originalPost.author.displayName;
                author.avatarUrl = post.originalPost.author.avatarUrl;
                original.author = author;
            }
            original.content = post.originalPost.content;
            original.attachmentKeys = post.originalPost.attachmentKeys;
            original.visibility = post.originalPost.visibility;
            original.createdAt = post.originalPost.createdAt;
            dto.originalPost = original;
        }

        return dto;
    }
}
