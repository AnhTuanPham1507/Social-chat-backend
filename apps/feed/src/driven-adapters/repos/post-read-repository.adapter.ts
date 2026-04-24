import { Injectable } from '@nestjs/common';
import { PostReadMongoRepository } from '@social-chat/infrastructure';
import { PostReadModel, IPostReadRepository, UpsertPostData } from '../../application/contracts/post-read-repository.contract';
import { CursorPaginatedResult } from '../../application/contracts/reaction-read-repository.contract';

@Injectable()
export class PostReadRepo implements IPostReadRepository {
    constructor(
        private readonly _postReadMongoRepo: PostReadMongoRepository,
    ) {}

    async upsertPost(id: string, data: UpsertPostData): Promise<void> {
        await this._postReadMongoRepo.upsert(id, data as any);
    }

    async deletePost(id: string): Promise<void> {
        await this._postReadMongoRepo.deleteById(id);
    }

    async incrementReactionCount(postId: string, reactionType: string, delta: number): Promise<void> {
        await this._postReadMongoRepo.incrementReactionCount(postId, reactionType, delta);
    }

    async changeReactionCount(postId: string, oldType: string, newType: string): Promise<void> {
        await this._postReadMongoRepo.changeReactionCount(postId, oldType, newType);
    }

    async findById(id: string): Promise<PostReadModel | null> {
        return this._postReadMongoRepo.findById(id) as Promise<PostReadModel | null>;
    }

    async incrementCommentsCount(postId: string, delta: number): Promise<void> {
        await this._postReadMongoRepo.incrementField(postId, 'totalCommentsCount', delta);
    }

    async incrementSharesCount(postId: string, delta: number): Promise<void> {
        await this._postReadMongoRepo.incrementField(postId, 'totalSharesCount', delta);
    }

    /**
     * Cursor-based feed query.
     *
     * Cursor contract: the `_id` of the last post the client already saw.
     * We resolve it to its `postCreatedAt` and do a compound-key comparison
     * `(postCreatedAt, _id) < (cursor.postCreatedAt, cursor._id)` so that
     * two posts sharing a timestamp never duplicate or disappear.
     *
     * Uses limit+1 trick to detect hasMore in a single query (no count).
     */
    async findFeedWithCursor(
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<PostReadModel>> {
        const filter: Record<string, any> = {
            visibility: 'public',
            postDeletedAt: null,
        };

        if (cursor) {
            const cursorDoc = await this._postReadMongoRepo.findById(cursor);
            if (cursorDoc) {
                filter.$or = [
                    { postCreatedAt: { $lt: cursorDoc.postCreatedAt } },
                    {
                        postCreatedAt: cursorDoc.postCreatedAt,
                        _id: { $lt: cursor },
                    },
                ];
            }
        }

        const docs = (await this._postReadMongoRepo.findManyWithOriginal(
            filter,
            {
                sort: { postCreatedAt: -1, _id: -1 },
                limit: limit + 1,
            },
        )) as PostReadModel[];

        const hasMore = docs.length > limit;
        if (hasMore) {
            docs.pop();
        }

        const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1]._id : null;

        return { items: docs, nextCursor, hasMore };
    }

    async findByAuthorId(authorId: string, page: number, limit: number): Promise<PostReadModel[]> {
        return this._postReadMongoRepo.findManyWithOriginal(
            { authorId, postDeletedAt: null },
            {
                sort: { postCreatedAt: -1 },
                skip: (page - 1) * limit,
                limit,
            },
        ) as Promise<PostReadModel[]>;
    }
}
