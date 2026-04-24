import { IElasticsearchConfig } from './interfaces/elasticsearch-config.interface';

export const getElasticsearchConfig = (): IElasticsearchConfig => ({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});
