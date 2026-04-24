import { PostEntity, POST_VISIBILITY } from '@social-chat/domain';
import { PostModel } from '@social-chat/infrastructure';

export class PostPersistenceMapper {
    static fromEntityToModel(entity: PostEntity): Partial<PostModel> {
        return {
            id: entity.id,
            authorId: entity.authorId,
            content: entity.content.value,
            visibility: entity.visibility,
            isEdited: entity.isEdited,
            editedAt: entity.editedAt,
            originalPostId: entity.originalPostId,
            attachmentKeys: entity.attachmentKeys,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
        };
    }

    static fromModelToEntity(model: PostModel): PostEntity {
        return PostEntity.reconstitute({
            id: model.id,
            authorId: model.authorId,
            content: model.content,
            visibility: model.visibility as POST_VISIBILITY,
            isEdited: model.isEdited,
            editedAt: model.editedAt,
            originalPostId: model.originalPostId,
            attachmentKeys: model.attachmentKeys ?? [],
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt || undefined,
        });
    }
}
