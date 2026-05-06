import { Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
    BulkOperationContainer,
    IndicesUpdateAliasesAction,
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

    async recreateIndex(loader: (alias: string) => Promise<void>): Promise<void> {
        const { alias, settings, mappings } = this.indexConfig;

        const oldIndex = await this.getCurrentAliasTarget();
        const newIndex = `${alias}_${Date.now()}`;

        await this.esService.indices.create({
            index: newIndex,
            settings,
            mappings,
        });
        this.logger.log(`Created index "${newIndex}"`);

        const swapActions: IndicesUpdateAliasesAction[] = [
            { add: { index: newIndex, alias } },
        ];
        if (oldIndex) {
            swapActions.unshift({ remove: { index: oldIndex, alias } });
        }
        await this.esService.indices.updateAliases({ actions: swapActions });
        this.logger.log(
            oldIndex
                ? `Swapped alias "${alias}": "${oldIndex}" → "${newIndex}"`
                : `Attached alias "${alias}" → "${newIndex}"`,
        );

        await loader(alias);

        if (oldIndex) {
            await this.esService.indices.delete({ index: oldIndex });
            this.logger.log(`Deleted old index "${oldIndex}"`);
        }
    }

    private async getCurrentAliasTarget(): Promise<string | null> {
        try {
            const response = await this.esService.indices.getAlias({
                name: this.indexConfig.alias,
            });
            const indices = Object.keys(response);
            if (indices.length === 0) return null;
            if (indices.length > 1) {
                this.logger.warn(
                    `Alias "${this.indexConfig.alias}" points to multiple indices: ${indices.join(', ')}. Using "${indices[0]}".`,
                );
            }
            return indices[0];
        } catch (error: any) {
            if (error?.meta?.statusCode === 404) return null;
            throw error;
        }
    }

    // =========================================================================
    // DOCUMENT OPERATIONS
    // =========================================================================

    async indexDocument(id: string, document: TDocument, version?: number): Promise<void> {
        try {
            await this.esService.index({
                index: this.indexConfig.alias,
                id,
                document,
                ...(version !== undefined
                    ? { version, version_type: 'external' }
                    : {}),
            });
        } catch (error: any) {
            if (error?.meta?.statusCode === 409) {
                this.logger.log(
                    `Skipped stale write for "${id}" (incoming version=${version} <= stored)`,
                );
                return;
            }
            throw error;
        }
    }

    async bulkIndex(
        documents: TDocument[],
        idField: keyof TDocument = 'id' as keyof TDocument,
        getVersion?: (doc: TDocument) => number,
    ): Promise<void> {
        if (documents.length === 0) return;

        const operations = documents.flatMap((doc) => {
            const meta: BulkOperationContainer = {
                index: {
                    _index: this.indexConfig.alias,
                    _id: String(doc[idField]),
                    ...(getVersion
                        ? { version: getVersion(doc), version_type: 'external' }
                        : {}),
                },
            };
            return [meta, doc];
        });

        const response = await this.esService.bulk({
            operations,
            refresh: true,
        });

        if (!response.errors) return;

        const stale: typeof response.items = [];
        const failed: typeof response.items = [];
        for (const item of response.items) {
            const status = item.index?.status;
            if (status === 409) {
                stale.push(item);
            } else if (item.index?.error) {
                failed.push(item);
            }
        }

        if (stale.length > 0) {
            this.logger.log(
                `Skipped ${stale.length}/${documents.length} stale bulk writes (409, expected under version_type=external)`,
            );
        }
        if (failed.length > 0) {
            this.logger.error(
                `Bulk index errors: ${failed.length}/${documents.length} failed`,
                JSON.stringify(failed.map((item) => item.index?.error)),
            );
        }
    }

    async deleteDocument(id: string, version?: number): Promise<void> {
        try {
            await this.esService.delete({
                index: this.indexConfig.alias,
                id,
                ...(version !== undefined
                    ? { version, version_type: 'external' }
                    : {}),
            });
        } catch (error: any) {
            if (error?.meta?.statusCode === 404) {
                this.logger.warn(`Document "${id}" not found for deletion`);
                return;
            }
            if (error?.meta?.statusCode === 409) {
                this.logger.log(
                    `Skipped stale delete for "${id}" (incoming version=${version} <= stored)`,
                );
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
