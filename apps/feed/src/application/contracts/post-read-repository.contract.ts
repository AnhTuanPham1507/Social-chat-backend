import { CursorPaginatedResult } from './reaction-read-repository.contract';

export const POST_READ_REPO_TOKEN = Symbol('POST_READ_REPO_TOKEN');

export interface IPostReadRepository {
    // CDC write operations
    upsertPost(id: string, data: UpsertPostData): Promise<void>;
    deletePost(id: string): Promise<void>;
    incrementReactionCount(postId: string, reactionType: string, delta: number): Promise<void>;
    changeReactionCount(postId: string, oldType: string, newType: string): Promise<void>;

    // Comment operations
    incrementCommentsCount(postId: string, delta: number): Promise<void>;

    // Share operations
    incrementSharesCount(postId: string, delta: number): Promise<void>;

    // Author denormalization sync (called from user CDC fan-out)
    updateAuthorInfo(userId: string, author: { name: string; avatar?: string }): Promise<void>;

    // Query operations
    findById(id: string): Promise<PostReadModel | null>;
    /**
     * Cursor-based feed query. Cursor is the `_id` of the last post the
     * client has already seen; the adapter resolves it to (postCreatedAt, _id)
     * for a stable compound-key comparison. Returns limit+1 under the hood
     * to compute hasMore without an extra count query.
     */
    findFeedWithCursor(limit: number, cursor?: string): Promise<CursorPaginatedResult<PostReadModel>>;
    findByAuthorId(authorId: string, page: number, limit: number): Promise<PostReadModel[]>;
    /**
     * Bulk fetch posts by IDs with the original-post + author $lookup applied,
     * exactly like the feed query. Used by search to enrich ES-ranked IDs into
     * full read models. Order of returned docs is NOT guaranteed — callers
     * that need ranked order must reorder via the input id list themselves.
     */
    findManyByIds(ids: string[]): Promise<PostReadModel[]>;
}

export interface PostAuthor {
    id: string;
    name: string;
    avatar?: string;
}

export interface PostReadModel {
    _id: string;
    authorId: string;
    /**
     * Snapshot of the author's profile, denormalized at write time via the
     * post CDC handler and kept fresh by the user CDC fan-out. Optional
     * because legacy rows written before this field existed may be missing
     * it until their author's next profile update.
     */
    author?: PostAuthor;
    content?: string;
    visibility: string;
    isEdited: boolean;
    editedAt?: Date;
    originalPostId?: string;
    attachmentKeys: string[];
    reactionCounts: {
        like: number;
        love: number;
        haha: number;
        wow: number;
        sad: number;
        angry: number;
    };
    totalCommentsCount: number;
    totalSharesCount: number;
    postCreatedAt: Date;
    postUpdatedAt: Date;
    postDeletedAt?: Date;
    /**
     * Populated by $lookup at query time when this post is a share.
     * Always represents the live state of the original — used by the
     * mapper to compute tombstone visibility at read time.
     */
    originalPost?: PostReadModel | null;
    /**
     * Joined profile of the original post's author. Populated alongside
     * originalPost when this row is a share AND the user document exists.
     */
    originalPostAuthor?: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    } | null;
}

export interface UpsertPostData {
    authorId: string;
    author?: PostAuthor;
    content?: string;
    visibility: string;
    isEdited: boolean;
    editedAt?: Date;
    originalPostId?: string;
    attachmentKeys: string[];
    postCreatedAt: Date;
    postUpdatedAt: Date;
    postDeletedAt?: Date;
}
