import { Post } from '@application/dtos/post.dto';
import { PostDTO } from '../dtos/post.dto';

export class PostMapper {
    static fromAppModelToDTO(post: Post): PostDTO {
        const dto = new PostDTO();
        dto.id = post.id;
        dto.authorId = post.authorId;
        dto.content = post.content;
        dto.visibility = post.visibility;
        dto.isEdited = post.isEdited;
        dto.editedAt = post.editedAt;
        dto.originalPostId = post.originalPostId;
        dto.reactionsCount = post.reactionsCount;
        dto.commentsCount = post.commentsCount;
        dto.sharesCount = post.sharesCount;
        dto.attachmentKeys = post.attachmentKeys;
        dto.createdAt = post.createdAt;
        dto.updatedAt = post.updatedAt;

        return dto;
    }
}
