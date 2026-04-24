import { Comment, CommentReadDTO } from '@application/dtos/comment.dto';
import { CommentDTO, CommentReadResponseDTO } from '../dtos/comment.dto';

export class CommentMapper {
    static fromAppModelToDTO(comment: Comment): CommentDTO {
        const dto = new CommentDTO();
        dto.id = comment.id;
        dto.postId = comment.postId;
        dto.authorId = comment.authorId;
        dto.parentCommentId = comment.parentCommentId;
        dto.content = comment.content;
        dto.attachments = comment.attachments;
        dto.isEdited = comment.isEdited;
        dto.editedAt = comment.editedAt;
        dto.createdAt = comment.createdAt;
        dto.updatedAt = comment.updatedAt;

        return dto;
    }

    static fromReadDTOToResponse(readDTO: CommentReadDTO): CommentReadResponseDTO {
        const dto = new CommentReadResponseDTO();
        dto.id = readDTO.id;
        dto.postId = readDTO.postId;
        dto.author = readDTO.author;
        dto.parentCommentId = readDTO.parentCommentId;
        dto.content = readDTO.content;
        dto.attachments = readDTO.attachments;
        dto.isEdited = readDTO.isEdited;
        dto.editedAt = readDTO.editedAt;
        dto.reactionCounts = readDTO.reactionCounts;
        dto.repliesCount = readDTO.repliesCount;
        dto.myReaction = readDTO.myReaction;
        dto.createdAt = readDTO.createdAt;
        dto.updatedAt = readDTO.updatedAt;

        return dto;
    }
}
