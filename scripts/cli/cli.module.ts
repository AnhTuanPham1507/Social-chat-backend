import { resolve } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
    configs,
    DATABASE_CONFIG,
    IDatabaseConfig,
} from '@social-chat/common';
import {
    ElasticsearchInfraModule,
    PostgresModule,
} from '@social-chat/infrastructure';

import { PostSearchRepo } from '../../apps/feed/src/driven-adapters/repos/post-search-repository.adapter';
import { ReindexPostsCommand } from './commands/infra-reindex-posts.command';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: [
                resolve(__dirname, '..', '..', 'config', '.env.feed'),
                resolve(__dirname, '..', '..', 'config', '.env.common'),
            ],
            load: [configs],
        }),
        PostgresModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) =>
                configService.get<IDatabaseConfig>(DATABASE_CONFIG),
        }),
        ElasticsearchInfraModule,
    ],
    providers: [PostSearchRepo, ReindexPostsCommand],
})
export class CliModule {}
