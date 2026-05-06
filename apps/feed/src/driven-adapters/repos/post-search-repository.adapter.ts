import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { convert } from 'html-to-text';
import {
    BaseElasticsearchService,
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
    AutocompleteSuggestion,
    PostSearchHitResult,
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
        await this.indexDocument(
            id,
            this.toSearchDoc(document),
            document.updatedAt.getTime(),
        );
    }

    async bulkIndexPosts(documents: PostSearchDocument[]): Promise<void> {
        await this.bulkIndex(
            documents.map((d) => this.toSearchDoc(d)),
            'id',
            (doc) => doc.updatedAt.getTime(),
        );
    }

    async deletePost(id: string, deletedAt?: Date): Promise<void> {
        await this.deleteDocument(id, deletedAt?.getTime());
    }

    private toSearchDoc(document: PostSearchDocument): PostSearchDocument {
        return {
            ...document,
            content: convert(document.content ?? '', {
                wordwrap: false,
                selectors: [{ selector: 'a', options: { ignoreHref: true } }],
            }),
        };
    }

    async autocomplete(
        query: string,
        size: number = 8,
        visibility?: string,
    ): Promise<AutocompleteSuggestion[]> {
        const trimmed = query?.trim();
        if (!trimmed) return [];

        const filter: QueryDslQueryContainer[] = [];
        if (visibility) {
            filter.push({ term: { visibility } });
        }

        const response = await this.esService.search<PostSearchDocument>({
            index: this.indexConfig.alias,
            _source: ['id', 'content'],
            size,
            query: {
                bool: {
                    must: [
                        {
                            multi_match: {
                                query: trimmed,
                                type: 'bool_prefix',
                                fields: ['content_suggest', 'content_suggest._2gram', 'content_suggest._3gram'],
                                operator: 'and',          // ← all terms required
                            }
                        },
                    ],
                    filter,
                },
            },
            highlight: {
                require_field_match: false,
                fields: {
                    content: {
                        highlight_query: {
                            match: { content: { query: trimmed, operator: 'or' } },
                        },
                        pre_tags: ['<em>'],
                        post_tags: ['</em>'],
                        fragment_size: 80,
                        number_of_fragments: 1,
                        no_match_size: 0,
                    },
                },
            },
            sort: [{ _score: { order: 'desc' } }, { createdAt: { order: 'desc' } }],
        });

        return response.hits.hits.map((hit) => {
            const src = hit._source as PostSearchDocument;
            const text = src?.content ?? '';
            const highlight = hit.highlight?.content?.[0];
            return {
                id: hit._id ?? src?.id,
                text: text.length > 120 ? text.slice(0, 120) + '…' : text,
                highlight,
            } as AutocompleteSuggestion;
        });
    }

    async searchPosts(
        query: string,
        filters?: PostSearchFilters,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<PostSearchHitResult> {
        const boolQuery = this.buildSearchQuery(query, filters);
        const scoredQuery = this.wrapWithRecency(boolQuery);
        const requestedSize = size ?? 20;

        // Fetch one extra to compute hasMore in a single query.
        const response = await this.esService.search<PostSearchDocument>({
            index: this.indexConfig.alias,
            _source: false,
            query: scoredQuery,
            size: requestedSize + 1,
            sort: [
                { _score: { order: 'desc' } },
                { createdAt: { order: 'desc' } },
                { id: { order: 'desc' } },
            ],
            search_after: searchAfter,
        });

        const total =
            typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value ?? 0;

        const rawHits = response.hits.hits;
        const hasMore = rawHits.length > requestedSize;
        const trimmedHits = hasMore ? rawHits.slice(0, requestedSize) : rawHits;

        const hits = trimmedHits.map((hit) => ({
            id: hit._id as string,
            score: hit._score ?? undefined,
            sort: hit.sort as (string | number)[] | undefined,
        }));

        const nextSearchAfter =
            hasMore && hits.length > 0 ? hits[hits.length - 1].sort ?? null : null;

        return { hits, total, hasMore, nextSearchAfter };
    }

    private wrapWithRecency(
        query: QueryDslQueryContainer,
    ): QueryDslQueryContainer {
        return {
            function_score: {
                query,
                functions: [
                    {
                        gauss: {
                            createdAt: {
                                origin: 'now',
                                offset: '24h',
                                scale: '7d',
                                decay: 0.5,
                            },
                        },
                    },
                ],
                score_mode: 'sum',
                boost_mode: 'multiply',
            },
        };
    }

    private buildSearchQuery(
        query: string,
        filters?: PostSearchFilters,
    ): QueryDslQueryContainer {
        const must: QueryDslQueryContainer[] = [];
        const filter: QueryDslQueryContainer[] = [];

        if (query) {
            must.push({
                bool: {
                    should: [
                        {
                            match: {
                                content: {
                                    query,
                                    operator: 'and',
                                    boost: 3,
                                },
                            },
                        },
                        {
                            match: {
                                content: {
                                    query,
                                    operator: 'and',
                                    fuzziness: 'AUTO:4,7',
                                    prefix_length: 2,
                                    max_expansions: 50,
                                    analyzer: 'content_analyzer',
                                    boost: 1,
                                },
                            },
                        },
                        {
                            multi_match: {
                                query,
                                type: 'bool_prefix',
                                fields: [
                                    'content_suggest',
                                    'content_suggest._2gram',
                                    'content_suggest._3gram',
                                ],
                                operator: 'and',
                                boost: 0.5,
                            },
                        },
                    ],
                    minimum_should_match: 1,
                },
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
