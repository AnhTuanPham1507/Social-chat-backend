import { Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
    BulkOperationContainer,
    MappingTypeMapping,
    IndicesIndexSettings,
    QueryDslQueryContainer,
    SearchRequest,
    SortCombinations,
} from '@elastic/elasticsearch/lib/api/types';

export interface SearchResult<TDocument> {
    items: TDocument[];
    total: number;
}

export interface IndexConfig {
    index: string;
    alias: string;
    settings: IndicesIndexSettings;
    mappings: MappingTypeMapping;
}

export abstract class BaseElasticsearchService<TDocument extends Record<string, any>>
    implements OnModuleInit
{
    protected readonly logger: Logger;

    constructor(
        protected readonly esService: ElasticsearchService,
        protected readonly indexConfig: IndexConfig,
    ) {
        this.logger = new Logger(this.constructor.name);
    }

    // =========================================================================
    // INDEX LIFECYCLE (runs on module init)
    // =========================================================================

    async onModuleInit(): Promise<void> {
        await this.ensureIndex();
    }

    private async ensureIndex(): Promise<void> {
        const { alias, index, settings, mappings } = this.indexConfig;

        const aliasExists = await this.esService.indices.existsAlias({
            name: alias,
        });

        if (aliasExists) {
            this.logger.log(`Alias "${alias}" already exists, skipping index creation`);
            return;
        }

        const indexExists = await this.esService.indices.exists({
            index,
        });

        if (!indexExists) {
            await this.esService.indices.create({
                index,
                settings,
                mappings,
            });
            this.logger.log(`Created index "${index}"`);
        }

        await this.esService.indices.putAlias({
            index,
            name: alias,
        });
        this.logger.log(`Created alias "${alias}" → "${index}"`);
    }

    // =========================================================================
    // DOCUMENT OPERATIONS
    // =========================================================================

    async indexDocument(id: string, document: TDocument): Promise<void> {
        await this.esService.index({
            index: this.indexConfig.alias,
            id,
            document,
        });
    }

    async bulkIndex(documents: TDocument[], idField: keyof TDocument = 'id' as keyof TDocument): Promise<void> {
        if (documents.length === 0) return;

        const operations = documents.flatMap((doc) => [
            { index: { _index: this.indexConfig.alias, _id: String(doc[idField]) } } as BulkOperationContainer,
            doc,
        ]);

        const response = await this.esService.bulk({
            operations,
            refresh: true,
        });

        if (response.errors) {
            const errorItems = response.items.filter((item) => item.index?.error);
            this.logger.error(
                `Bulk index errors: ${errorItems.length}/${documents.length} failed`,
                JSON.stringify(errorItems.map((item) => item.index?.error)),
            );
        }
    }

    async deleteDocument(id: string): Promise<void> {
        try {
            await this.esService.delete({
                index: this.indexConfig.alias,
                id,
            });
        } catch (error: any) {
            if (error?.meta?.statusCode === 404) {
                this.logger.warn(`Document "${id}" not found for deletion`);
                return;
            }
            throw error;
        }
    }

    // =========================================================================
    // SEARCH (protected — subclasses build queries and call this)
    // =========================================================================

    protected async executeSearch(
        query: QueryDslQueryContainer,
        options?: {
            from?: number;
            size?: number;
            sort?: SortCombinations[];
            searchAfter?: (string | number)[];
            highlight?: SearchRequest['highlight'];
        },
    ): Promise<SearchResult<TDocument>> {
        const response = await this.esService.search<TDocument>({
            index: this.indexConfig.alias,
            query,
            from: options?.searchAfter ? undefined : options?.from,
            size: options?.size ?? 20,
            sort: options?.sort,
            search_after: options?.searchAfter,
            highlight: options?.highlight,
        });

        const total =
            typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value ?? 0;

        const items = response.hits.hits.map((hit) => ({
            ...hit._source as TDocument,
            ...(hit.highlight ? { _highlight: hit.highlight } : {}),
        }));

        return { items, total };
    }
}
