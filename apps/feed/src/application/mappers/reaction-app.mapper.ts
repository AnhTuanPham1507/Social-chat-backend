import { ReactionEntity } from '@social-chat/domain';
import { Reaction } from '../dtos/reaction.dto';

export class ReactionAppMapper {
    static fromEntityToAppModel(entity: ReactionEntity): Reaction {
        return {
            id: entity.id,
            contentId: entity.contentId,
            contentType: entity.contentType,
            userId: entity.userId,
            type: entity.type,
            createdAt: entity.createdAt,
        };
    }
}
