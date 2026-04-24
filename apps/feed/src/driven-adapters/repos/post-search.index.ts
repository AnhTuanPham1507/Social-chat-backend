import { IndicesIndexSettings, MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const POST_SEARCH_INDEX = 'posts';

export const postSearchIndexSettings: IndicesIndexSettings = {
    analysis: {
        analyzer: {
            content_analyzer: {
                type: 'custom',
                tokenizer: 'icu_tokenizer',
                filter: ['icu_folding'],
            } as any,
        },
    },
};

export const postSearchIndexMapping: MappingTypeMapping = {
    properties: {
        id: { type: 'keyword' },
        content: {
            type: 'text',
            analyzer: 'content_analyzer',
        },
        visibility: { type: 'keyword' },
        authorId: { type: 'keyword' },
        createdAt: { type: 'date' },
    },
};
