import { Reaction } from '@application/dtos/reaction.dto';
import { ReactionDTO } from '../dtos/reaction.dto';

export class ReactionMapper {
    static fromAppModelToDTO(reaction: Reaction): ReactionDTO {
        const dto = new ReactionDTO();
        dto.id = reaction.id;
        dto.contentId = reaction.contentId;
        dto.contentType = reaction.contentType;
        dto.userId = reaction.userId;
        dto.type = reaction.type;
        dto.createdAt = reaction.createdAt;

        return dto;
    }
}
