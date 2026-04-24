import { CommentEntity } from '@social-chat/domain';
import { Comment } from '../dtos/comment.dto';

export class CommentAppMapper {
    static fromEntityToAppModel(entity: CommentEntity): Comment {
        return {
            id: entity.id,
            postId: entity.postId,
            authorId: entity.authorId,
            parentCommentId: entity.parentCommentId,
            content: entity.content.value,
            attachments: entity.attachments,
            isEdited: entity.isEdited,
            editedAt: entity.editedAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
