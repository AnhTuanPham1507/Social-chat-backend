import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule as NestElasticsearchModule } from '@nestjs/elasticsearch';

import {
    ELASTICSEARCH_CONFIG,
    IElasticsearchConfig,
} from '@social-chat/common';

@Module({
    imports: [
        NestElasticsearchModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const config =
                    configService.get<IElasticsearchConfig>(ELASTICSEARCH_CONFIG);

                return {
                    node: config.node,
                };
            },
        }),
    ],
    exports: [NestElasticsearchModule],
})
@Global()
export class ElasticsearchInfraModule {}
