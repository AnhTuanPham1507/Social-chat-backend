import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPE, REACTION_TYPE } from '@social-chat/domain';
import { CommentReadDTO } from '../dtos/comment.dto';
import {
    COMMENT_READ_REPO_TOKEN,
    CommentReadModel,
    ICommentReadRepository,
} from '../contracts/comment-read-repository.contract';
import { CursorPaginatedResult } from '../contracts/reaction-read-repository.contract';
import { IReactionRepository, REACTION_REPO_TOKEN } from '../contracts/reaction-repository.contract';

export const COMMENT_QUERY_APPLICATION_SERVICE_TOKEN = Symbol('COMMENT_QUERY_APPLICATION_SERVICE_TOKEN');

export interface ICommentQueryApplicationService {
    getCommentsByPostId(
        userId: string,
        postId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadDTO>>;
    getReplies(
        userId: string,
        parentCommentId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadDTO>>;
}

@Injectable()
export class CommentQueryApplicationService implements ICommentQueryApplicationService {
    constructor(
        @Inject(COMMENT_READ_REPO_TOKEN)
        private readonly _commentReadRepo: ICommentReadRepository,
        @Inject(REACTION_REPO_TOKEN)
        private readonly _reactionRepo: IReactionRepository,
    ) {}

    async getCommentsByPostId(
        userId: string,
        postId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadDTO>> {
        const result = await this._commentReadRepo.findByPostIdWithCursor(postId, limit, cursor);
        const items = await this.enrichWithMyReactions(result.items, userId);
        return { items, nextCursor: result.nextCursor, hasMore: result.hasMore };
    }

    async getReplies(
        userId: string,
        parentCommentId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadDTO>> {
        const result = await this._commentReadRepo.findRepliesWithCursor(parentCommentId, limit, cursor);
        const items = await this.enrichWithMyReactions(result.items, userId);
        return { items, nextCursor: result.nextCursor, hasMore: result.hasMore };
    }

    private async enrichWithMyReactions(docs: CommentReadModel[], userId: string): Promise<CommentReadDTO[]> {
        if (docs.length === 0) return [];

        const commentIds = docs.map((doc) => doc._id);
        const myReactions = await this._reactionRepo.findByContentIdsAndUserId(commentIds, CONTENT_TYPE.COMMENT, userId);

        return docs.map((doc) => this.toReadDTO(doc, myReactions.get(doc._id) ?? null));
    }

    private toReadDTO(doc: CommentReadModel, myReaction: REACTION_TYPE | null): CommentReadDTO {
        return {
            id: doc._id,
            postId: doc.postId,
            author: doc.author,
            parentCommentId: doc.parentCommentId,
            content: doc.content,
            attachments: doc.attachments,
            isEdited: doc.isEdited,
            editedAt: doc.editedAt,
            reactionCounts: doc.reactionCounts,
            repliesCount: doc.repliesCount,
            myReaction: myReaction,
            createdAt: doc.commentCreatedAt,
            updatedAt: doc.commentUpdatedAt,
        };
    }
}
