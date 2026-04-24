import { CursorPaginatedResult } from './reaction-read-repository.contract';

export const COMMENT_READ_REPO_TOKEN = Symbol('COMMENT_READ_REPO_TOKEN');

export interface CommentReadModel {
    _id: string;
    postId: string;
    parentCommentId?: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    content: string;
    attachments: string[];
    isEdited: boolean;
    editedAt?: Date;
    reactionCounts: {
        like: number;
        love: number;
        haha: number;
        wow: number;
        sad: number;
        angry: number;
    };
    repliesCount: number;
    commentCreatedAt: Date;
    commentUpdatedAt: Date;
    commentDeletedAt?: Date;
}

export interface UpsertCommentData {
    postId: string;
    parentCommentId?: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    content: string;
    attachments: string[];
    isEdited: boolean;
    editedAt?: Date;
    commentCreatedAt: Date;
    commentUpdatedAt: Date;
    commentDeletedAt?: Date;
}

export interface ICommentReadRepository {
    // CDC write operations
    upsertComment(id: string, data: UpsertCommentData): Promise<void>;
    deleteComment(id: string): Promise<void>;
    incrementReactionCount(commentId: string, reactionType: string, delta: number): Promise<void>;
    changeReactionCount(commentId: string, oldType: string, newType: string): Promise<void>;
    incrementRepliesCount(commentId: string, delta: number): Promise<void>;

    // User profile fan-out
    updateAuthorInfo(userId: string, author: { name: string; avatar?: string }): Promise<void>;

    // Query operations
    /**
     * Cursor-based top-level comments. Cursor is the `_id` of the last
     * comment the client saw; resolved to (commentCreatedAt, _id) for a
     * stable compound-key comparison. Sort is newest-first (DESC).
     */
    findByPostIdWithCursor(
        postId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadModel>>;
    /**
     * Cursor-based replies to a parent comment. Same compound-key
     * contract as findByPostIdWithCursor.
     */
    findRepliesWithCursor(
        parentCommentId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<CommentReadModel>>;
    countByPostId(postId: string): Promise<number>;
    countReplies(parentCommentId: string): Promise<number>;
}
