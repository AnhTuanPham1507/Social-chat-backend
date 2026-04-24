import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
    BaseElasticsearchService,
    SearchResult,
} from '@social-chat/infrastructure';
import {
    POST_SEARCH_INDEX,
    postSearchIndexSettings,
    postSearchIndexMapping,
} from './post-search.index';
import {
    IPostSearchRepository,
    PostSearchDocument,
    PostSearchFilters,
} from '../../application/contracts/post-search-repository.contract';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

const INDEX_VERSION = 'posts_v1';

@Injectable()
export class PostSearchRepo
    extends BaseElasticsearchService<PostSearchDocument>
    implements IPostSearchRepository
{
    constructor(esService: ElasticsearchService) {
        super(esService, {
            index: INDEX_VERSION,
            alias: POST_SEARCH_INDEX,
            settings: postSearchIndexSettings,
            mappings: postSearchIndexMapping,
        });
    }

    async indexPost(id: string, document: PostSearchDocument): Promise<void> {
        await this.indexDocument(id, document);
    }

    async deletePost(id: string): Promise<void> {
        await this.deleteDocument(id);
    }

    async searchPosts(
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<SearchResult<PostSearchDocument>> {
        const boolQuery = this.buildSearchQuery(query, filters);

        return this.executeSearch(boolQuery, {
            size: size ?? 20,
            sort: [
                { _score: { order: 'desc' } },
                { createdAt: { order: 'desc' } },
            ],
            searchAfter,
            highlight: {
                fields: {
                    content: {
                        pre_tags: ['<em>'],
                        post_tags: ['</em>'],
                        fragment_size: 150,
                        number_of_fragments: 3,
                    },
                },
            },
        });
    }

    private buildSearchQuery(
        query: string,
        filters?: PostSearchFilters,
    ): QueryDslQueryContainer {
        const must: QueryDslQueryContainer[] = [];
        const filter: QueryDslQueryContainer[] = [];

        if (query) {
            must.push({
                match: { content: query },
            });
        }

        // Exact match filters
        if (filters?.visibility) {
            filter.push({
                term: { visibility: filters.visibility },
            });
        }

        if (filters?.authorId) {
            filter.push({
                term: { authorId: filters.authorId },
            });
        }

        // Date range filter
        if (filters?.dateFrom || filters?.dateTo) {
            const range: Record<string, any> = {};
            if (filters.dateFrom) range.gte = filters.dateFrom.toISOString();
            if (filters.dateTo) range.lte = filters.dateTo.toISOString();

            filter.push({
                range: { createdAt: range },
            });
        }

        return {
            bool: {
                must: must.length > 0 ? must : [{ match_all: {} }],
                filter,
            },
        };
    }
}
