import { SearchResult } from '@social-chat/infrastructure';

export const POST_SEARCH_REPO_TOKEN = Symbol('POST_SEARCH_REPO_TOKEN');

export interface PostSearchDocument {
    id: string;
    content: string;
    visibility: string;
    authorId: string;
    createdAt: Date;
}

export interface PostSearchFilters {
    visibility?: string;
    authorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface IPostSearchRepository {
    // CDC write operations
    indexPost(id: string, document: PostSearchDocument): Promise<void>;
    deletePost(id: string): Promise<void>;

    // Query operations
    searchPosts(
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<SearchResult<PostSearchDocument>>;
}
