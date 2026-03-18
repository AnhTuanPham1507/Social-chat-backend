import { PostEntity } from '@social-chat/domain';
import { Post } from '../dtos/post.dto';

export class PostAppMapper {
    static fromEntityToAppModel(entity: PostEntity): Post {
        return {
            id: entity.id,
            authorId: entity.authorId,
            content: entity.content.value,
            visibility: entity.visibility,
            isEdited: entity.isEdited,
            editedAt: entity.editedAt,
            originalPostId: entity.originalPostId,
            reactionsCount: entity.reactionsCount,
            commentsCount: entity.commentsCount,
            sharesCount: entity.sharesCount,
            attachmentKeys: entity.attachmentKeys,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
        };
    }
}
