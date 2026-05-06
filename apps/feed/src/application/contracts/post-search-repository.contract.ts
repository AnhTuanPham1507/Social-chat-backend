export const POST_SEARCH_REPO_TOKEN = Symbol('POST_SEARCH_REPO_TOKEN');

export interface PostSearchDocument {
    id: string;
    content: string;
    visibility: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PostSearchFilters {
    visibility?: string;
    authorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface AutocompleteSuggestion {
    id: string;
    text: string;
    highlight?: string;
}

/**
 * A single ranked hit from Elasticsearch. We only keep the id +
 * sort cursor — the application layer enriches with the read model
 * (reactions, counts, shared original, etc.) so the search response
 * shape matches the list-feed API. Highlights are intentionally NOT
 * carried here; the autocomplete endpoint is where snippets live.
 */
export interface PostSearchHit {
    id: string;
    score?: number;
    /** Raw sort values from ES, used as the next searchAfter cursor. */
    sort?: (string | number)[];
}

export interface PostSearchHitResult {
    hits: PostSearchHit[];
    total: number;
    nextSearchAfter: (string | number)[] | null;
    hasMore: boolean;
}

export interface IPostSearchRepository {
    // CDC write operations
    indexPost(id: string, document: PostSearchDocument): Promise<void>;
    deletePost(id: string, deletedAt?: Date): Promise<void>;

    // Query operations
    searchPosts(
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<PostSearchHitResult>;

    autocomplete(
        query: string,
        size?: number,
        visibility?: string,
    ): Promise<AutocompleteSuggestion[]>;
}
