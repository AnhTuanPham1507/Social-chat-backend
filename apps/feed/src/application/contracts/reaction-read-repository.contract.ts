export const REACTION_READ_REPO_TOKEN = Symbol('REACTION_READ_REPO_TOKEN');

export interface ReactionReadModel {
    _id: string;
    contentId: string;
    contentType: string;
    reaction: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    reactionCreatedAt: Date;
}

export interface UpsertReactionData {
    contentId: string;
    contentType: string;
    reaction: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    reactionCreatedAt: Date;
}

export interface CursorPaginatedResult<T> {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface ReactionCountByContent {
    contentId: string;
    contentType: string;
    reaction: string;
    count: number;
}

export interface IReactionReadRepository {
    // CDC write operations
    upsertReaction(id: string, data: UpsertReactionData): Promise<void>;
    deleteReaction(id: string): Promise<void>;

    // User profile fan-out
    updateAuthorInfo(userId: string, author: { name: string; avatar?: string }): Promise<void>;

    // User deletion
    aggregateReactionCountsByUserId(userId: string): Promise<ReactionCountByContent[]>;
    deleteAllByUserId(userId: string): Promise<void>;

    // Query operations
    findByContentId(contentId: string, contentType: string, page: number, limit: number): Promise<ReactionReadModel[]>;
    findByContentIdWithCursor(
        contentId: string,
        contentType: string,
        limit: number,
        cursor?: string,
        reactionType?: string,
    ): Promise<CursorPaginatedResult<ReactionReadModel>>;
}
