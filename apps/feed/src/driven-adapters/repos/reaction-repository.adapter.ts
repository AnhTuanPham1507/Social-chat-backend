import { Injectable } from '@nestjs/common';
import { In, DeleteResult } from 'typeorm';

import { ReactionPersistenceMapper } from './mappers/reaction-persistence.mapper';
import { BaseReactionRepository } from '@social-chat/infrastructure';
import { CONTENT_TYPE, REACTION_TYPE, ReactionEntity } from '@social-chat/domain';
import { IReactionRepository } from '@application/contracts/reaction-repository.contract';

@Injectable()
export class ReactionRepo implements IReactionRepository {
    constructor(
        private _reactionRepo: BaseReactionRepository,
    ) {}

    public async insert(reaction: ReactionEntity): Promise<void> {
        const model = ReactionPersistenceMapper.fromEntityToModel(reaction);
        await this._reactionRepo.create(model);
    }

    public async update(reaction: ReactionEntity): Promise<void> {
        const model = ReactionPersistenceMapper.fromEntityToModel(reaction);
        await this._reactionRepo.update(reaction.id, model);
    }

    public async delete(id: string): Promise<void> {
        await this._reactionRepo.hardDelete(id);
    }

    public async deleteByContentId(contentId: string, contentType: CONTENT_TYPE): Promise<void> {
        await this._reactionRepo.getRepository().delete({ contentId, contentType } as any);
    }

    public async deleteByContentIds(contentIds: string[], contentType: CONTENT_TYPE): Promise<void> {
        if (contentIds.length === 0) return;
        await this._reactionRepo.getRepository().delete({ contentId: In(contentIds), contentType } as any);
    }

    public async findById(id: string): Promise<ReactionEntity | null> {
        const model = await this._reactionRepo.findOne({ id } as any);
        return model ? ReactionPersistenceMapper.fromModelToEntity(model) : null;
    }

    public async findByContentIdAndUserId(
        contentId: string,
        contentType: CONTENT_TYPE,
        userId: string,
    ): Promise<ReactionEntity | null> {
        const model = await this._reactionRepo.findOne({ contentId, contentType, userId } as any);
        return model ? ReactionPersistenceMapper.fromModelToEntity(model) : null;
    }

    public async findByContentId(
        contentId: string,
        contentType: CONTENT_TYPE,
        page: number,
        limit: number,
    ): Promise<ReactionEntity[]> {
        const models = await this._reactionRepo.findAll({
            where: { contentId, contentType } as any,
            order: { createdAt: 'DESC' } as any,
            skip: (page - 1) * limit,
            take: limit,
        });
        return models.map(ReactionPersistenceMapper.fromModelToEntity);
    }

    public async countByContentId(contentId: string, contentType: CONTENT_TYPE): Promise<number> {
        return this._reactionRepo.count({ contentId, contentType } as any);
    }

    public async findByContentIdsAndUserId(
        contentIds: string[],
        contentType: CONTENT_TYPE,
        userId: string,
    ): Promise<Map<string, REACTION_TYPE>> {
        if (contentIds.length === 0) {
            return new Map();
        }

        const models = await this._reactionRepo.findBy({
            contentId: In(contentIds),
            contentType,
            userId,
        } as any);

        const result = new Map<string, REACTION_TYPE>();
        for (const model of models) {
            result.set(model.contentId, model.reaction as REACTION_TYPE);
        }
        return result;
    }
}
