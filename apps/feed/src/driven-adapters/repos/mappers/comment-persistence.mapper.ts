import { CommentEntity } from '@social-chat/domain';
import { CommentModel } from '@social-chat/infrastructure';

export class CommentPersistenceMapper {
    static fromEntityToModel(entity: CommentEntity): Partial<CommentModel> {
        return {
            id: entity.id,
            postId: entity.postId,
            authorId: entity.authorId,
            parentCommentId: entity.parentCommentId,
            content: entity.content.value,
            isEdited: entity.isEdited,
            editedAt: entity.editedAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
            attachments: entity.attachments,
        };
    }

    static fromModelToEntity(model: CommentModel): CommentEntity {
        return CommentEntity.reconstitute({
            id: model.id,
            postId: model.postId,
            authorId: model.authorId,
            parentCommentId: model.parentCommentId,
            content: model.content,
            attachments: model.attachments,
            isEdited: model.isEdited,
            editedAt: model.editedAt,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt,
        });
    }
}
