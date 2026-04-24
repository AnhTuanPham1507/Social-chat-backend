import { PostEntity } from '@social-chat/domain';
import { PostDTO } from '../dtos/post.dto';

export class PostAppMapper {
    static fromEntityToAppModel(entity: PostEntity): PostDTO {
        return {
            id: entity.id,
            authorId: entity.authorId,
            content: entity.content.value,
            visibility: entity.visibility,
            isEdited: entity.isEdited,
            editedAt: entity.editedAt,
            originalPostId: entity.originalPostId,
            attachmentKeys: entity.attachmentKeys,
            reactions: {
                counts: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
                mine: null,
            },
            totalCommentsCount: 0,
            totalSharesCount: 0,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
        };
    }
}
