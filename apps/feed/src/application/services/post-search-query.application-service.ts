import { Inject, Injectable } from '@nestjs/common';
import {
    POST_SEARCH_REPO_TOKEN,
    IPostSearchRepository,
    PostSearchFilters,
    AutocompleteSuggestion,
} from '../contracts/post-search-repository.contract';
import { PostDTO } from '../dtos/post.dto';
import {
    IPostQueryApplicationService,
    POST_QUERY_APPLICATION_SERVICE_TOKEN,
} from './post-query.application-service';

export const POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN = Symbol(
    'POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN',
);

export interface SearchPostsResult {
    items: PostDTO[];
    total: number;
    nextSearchAfter: (string | number)[] | null;
    hasMore: boolean;
}

export interface IPostSearchQueryApplicationService {
    searchPosts(
        userId: string,
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<SearchPostsResult>;

    autocomplete(
        query: string,
        size?: number,
        visibility?: string,
    ): Promise<AutocompleteSuggestion[]>;
}

@Injectable()
export class PostSearchQueryApplicationService
    implements IPostSearchQueryApplicationService
{
    constructor(
        @Inject(POST_SEARCH_REPO_TOKEN)
        private readonly _postSearchRepo: IPostSearchRepository,
        @Inject(POST_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _postQueryService: IPostQueryApplicationService,
    ) {}

    async searchPosts(
        userId: string,
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<SearchPostsResult> {
        const result = await this._postSearchRepo.searchPosts(
            query,
            filters,
            size,
            searchAfter,
        );

        if (result.hits.length === 0) {
            return {
                items: [],
                total: result.total,
                nextSearchAfter: null,
                hasMore: false,
            };
        }

        const ids = result.hits.map((h) => h.id);
        const items = await this._postQueryService.getPostsByIds(userId, ids);

        return {
            items,
            total: result.total,
            nextSearchAfter: result.nextSearchAfter,
            hasMore: result.hasMore,
        };
    }

    async autocomplete(
        query: string,
        size?: number,
        visibility?: string,
    ): Promise<AutocompleteSuggestion[]> {
        return this._postSearchRepo.autocomplete(query, size, visibility);
    }
}
