import { CONTENT_TYPE, ReactionEntity, REACTION_TYPE } from '@social-chat/domain';
import { ReactionModel } from '@social-chat/infrastructure';

export class ReactionPersistenceMapper {
    static fromEntityToModel(entity: ReactionEntity): Partial<ReactionModel> {
        return {
            id: entity.id,
            contentId: entity.contentId,
            contentType: entity.contentType,
            userId: entity.userId,
            reaction: entity.type,
            createdAt: entity.createdAt,
        };
    }

    static fromModelToEntity(model: ReactionModel): ReactionEntity {
        return ReactionEntity.reconstitute({
            id: model.id,
            contentId: model.contentId,
            contentType: model.contentType as CONTENT_TYPE,
            userId: model.userId,
            type: model.reaction as REACTION_TYPE,
            createdAt: model.createdAt,
        });
    }
}
