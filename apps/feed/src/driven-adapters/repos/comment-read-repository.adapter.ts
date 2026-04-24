import { Injectable } from '@nestjs/common';
import { CommentReadMongoRepository } from '@social-chat/infrastructure';
import {
    CommentReadModel,
    ICommentReadRepository,
    UpsertCommentData,
} from '../../application/contracts/comment-read-repository.contract';
import { CursorPaginatedResult } from '../../application/contracts/reaction-read-repository.contract';

@Injectable()
export class CommentReadRepo implements ICommentReadRepository {
    constructor(
        private readonly _commentReadMongoRepo: CommentReadMongoRepository,
    ) {}

    async upsertComment(id: string, data: UpsertCommentData): Promise<void> {
        await this._commentReadMongoRepo.upsert(id, data as any);
    }

    async deleteComment(id: string): Promise<void> {
        await this._commentReadMongoRepo.deleteById(id);
    }

    async incrementReactionCount(commentId: string, reactionType: string, delta: number): Promise<void> {
        await this._commentReadMongoRepo.incrementReactionCount(commentId, reactionType, delta);
    }

    async changeReactionCount(commentId: string, oldType: string, newType: string): Promise<void> {
        await this._commentReadMongoRepo.changeReactionCount(commentId, oldType, newType);
    }

    async incrementRepliesCount(commentId: string, delta: number): Promise<void> {
        await this._commentReadMongoRepo.incrementRepliesCount(commentId, delta);
    }

    async updateAuthorInfo(userId: string, author: { name: string; avatar?: string }): Promise<void> {
        await this._commentReadMongoRepo.updateAuthorByUserId(userId, author);
    }

    async findByPostIdWithCursor(
        postId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadModel>> {
        return this.queryWithCursor(
            { postId, parentCommentId: null, commentDeletedAt: null },
            limit,
            cursor,
        );
    }

    async findRepliesWithCursor(
        parentCommentId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadModel>> {
        return this.queryWithCursor(
            { parentCommentId, commentDeletedAt: null },
            limit,
            cursor,
        );
    }

    /**
     * Shared cursor-pagination helper for comment queries.
     *
     * Cursor = the `_id` of the last comment the client saw. We resolve it
     * to its `commentCreatedAt` and do a compound-key comparison
     * `(commentCreatedAt, _id) < (cursor.commentCreatedAt, cursor._id)`,
     * guaranteeing no duplicates/gaps even when two comments share a ts.
     *
     * Uses the limit+1 trick to compute hasMore without an extra count.
     */
    private async queryWithCursor(
        baseFilter: Record<string, any>,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadModel>> {
        const filter: Record<string, any> = { ...baseFilter };

        if (cursor) {
            const cursorDoc = await this._commentReadMongoRepo.findById(cursor);
            if (cursorDoc) {
                filter.$or = [
                    { commentCreatedAt: { $lt: cursorDoc.commentCreatedAt } },
                    {
                        commentCreatedAt: cursorDoc.commentCreatedAt,
                        _id: { $lt: cursor },
                    },
                ];
            }
        }

        const docs = (await this._commentReadMongoRepo.findMany(
            filter,
            {
                sort: { commentCreatedAt: -1, _id: -1 },
                limit: limit + 1,
            },
        )) as CommentReadModel[];

        const hasMore = docs.length > limit;
        if (hasMore) {
            docs.pop();
        }

        const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1]._id : null;

        return { items: docs, nextCursor, hasMore };
    }

    async countByPostId(postId: string): Promise<number> {
        return this._commentReadMongoRepo.count({ postId, parentCommentId: null, commentDeletedAt: null });
    }

    async countReplies(parentCommentId: string): Promise<number> {
        return this._commentReadMongoRepo.count({ parentCommentId, commentDeletedAt: null });
    }
}
