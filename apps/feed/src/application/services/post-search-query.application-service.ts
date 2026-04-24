import { Inject, Injectable } from '@nestjs/common';
import {
    POST_SEARCH_REPO_TOKEN,
    IPostSearchRepository,
    PostSearchFilters,
    PostSearchDocument,
} from '../contracts/post-search-repository.contract';
import { SearchResult } from '@social-chat/infrastructure';

export const POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN = Symbol(
    'POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN',
);

export interface IPostSearchQueryApplicationService {
    searchPosts(
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<SearchResult<PostSearchDocument>>;
}

@Injectable()
export class PostSearchQueryApplicationService
    implements IPostSearchQueryApplicationService
{
    constructor(
        @Inject(POST_SEARCH_REPO_TOKEN)
        private readonly _postSearchRepo: IPostSearchRepository,
    ) {}

    async searchPosts(
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<SearchResult<PostSearchDocument>> {
        return this._postSearchRepo.searchPosts(query, filters, size, searchAfter);
    }
}
