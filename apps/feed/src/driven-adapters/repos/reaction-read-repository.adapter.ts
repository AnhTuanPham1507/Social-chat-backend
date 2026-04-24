import { Injectable } from '@nestjs/common';
import { ReactionReadMongoRepository } from '@social-chat/infrastructure';
import {
    CursorPaginatedResult,
    IReactionReadRepository,
    ReactionCountByContent,
    ReactionReadModel,
    UpsertReactionData,
} from '../../application/contracts/reaction-read-repository.contract';

@Injectable()
export class ReactionReadRepo implements IReactionReadRepository {
    constructor(
        private readonly _reactionReadMongoRepo: ReactionReadMongoRepository,
    ) {}

    async upsertReaction(id: string, data: UpsertReactionData): Promise<void> {
        await this._reactionReadMongoRepo.upsert(id, data as any);
    }

    async deleteReaction(id: string): Promise<void> {
        await this._reactionReadMongoRepo.deleteById(id);
    }

    async updateAuthorInfo(
        userId: string,
        author: { name: string; avatar?: string },
    ): Promise<void> {
        await this._reactionReadMongoRepo.updateAuthorByUserId(userId, author);
    }

    async aggregateReactionCountsByUserId(userId: string): Promise<ReactionCountByContent[]> {
        return this._reactionReadMongoRepo.aggregateReactionCountsByUserId(userId);
    }

    async deleteAllByUserId(userId: string): Promise<void> {
        await this._reactionReadMongoRepo.deleteAllByUserId(userId);
    }

    async findByContentId(
        contentId: string,
        contentType: string,
        page: number,
        limit: number,
    ): Promise<ReactionReadModel[]> {
        return this._reactionReadMongoRepo.findMany(
            { contentId, contentType },
            {
                sort: { reactionCreatedAt: -1 },
                skip: (page - 1) * limit,
                limit,
            },
        ) as Promise<ReactionReadModel[]>;
    }

    async findByContentIdWithCursor(
        contentId: string,
        contentType: string,
        limit: number,
        cursor?: string,
        reactionType?: string,
    ): Promise<CursorPaginatedResult<ReactionReadModel>> {
        const filter: Record<string, any> = { contentId, contentType };

        if (reactionType) {
            filter.reaction = reactionType;
        }

        if (cursor) {
            const cursorDoc = await this._reactionReadMongoRepo.findById(cursor);
            if (cursorDoc) {
                filter.$or = [
                    { reactionCreatedAt: { $lt: cursorDoc.reactionCreatedAt } },
                    {
                        reactionCreatedAt: cursorDoc.reactionCreatedAt,
                        _id: { $lt: cursor },
                    },
                ];
            }
        }

        const items = await this._reactionReadMongoRepo.findMany(
            filter,
            {
                sort: { reactionCreatedAt: -1, _id: -1 },
                limit: limit + 1,
            },
        ) as ReactionReadModel[];

        const hasMore = items.length > limit;
        if (hasMore) {
            items.pop();
        }

        const nextCursor = hasMore && items.length > 0
            ? items[items.length - 1]._id
            : null;

        return { items, nextCursor, hasMore };
    }
}
