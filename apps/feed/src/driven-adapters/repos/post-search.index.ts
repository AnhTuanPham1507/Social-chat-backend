import { IndicesIndexSettings, MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const POST_SEARCH_INDEX = 'posts';

export const postSearchIndexSettings: IndicesIndexSettings = {
    analysis: {
        filter: {
            vi_location_synonyms: {
                type: 'synonym_graph',
                synonyms: [
                    'hcm, ho chi minh, sài gòn, saigon, sg',
                    'hn, hà nội, hanoi',
                    'dn, đà nẵng, danang, da nang',
                ],
                lenient: true,
            } as any,
        },
        analyzer: {
            content_analyzer: {
                type: 'custom',
                tokenizer: 'icu_tokenizer',
                filter: ['icu_folding'],
            } as any,
            content_search_analyzer: {
                type: 'custom',
                tokenizer: 'icu_tokenizer',
                filter: ['icu_folding', 'vi_location_synonyms'],
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
            search_analyzer: 'content_search_analyzer',
            copy_to: ['content_suggest'],
        },
        content_suggest: {
            type: 'search_as_you_type',
            analyzer: 'content_analyzer',
            search_analyzer: 'content_search_analyzer',
        },
        visibility: { type: 'keyword' },
        authorId: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
    },
};
