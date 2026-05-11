import { resolve } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import {
    configs,
    DATABASE_CONFIG,
    IDatabaseConfig,
    IMongoConfig,
    MONGO_CONFIG,
} from '@social-chat/common';
import {
    ElasticsearchInfraModule,
    PostgresModule,
    PostRead,
    PostReadSchema,
    PostReadMongoRepository,
    UserRead,
    UserReadSchema,
    UserReadMongoRepository,
} from '@social-chat/infrastructure';

import { PostSearchRepo } from '../../apps/feed/src/driven-adapters/repos/post-search-repository.adapter';
import { ReindexPostsCommand } from './commands/infra-reindex-posts.command';
import { BackfillPostAuthorCommand } from './commands/infra-backfill-post-author.command';

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
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const mongoConfig = configService.get<IMongoConfig>(MONGO_CONFIG);
                return { uri: mongoConfig.uri };
            },
        }),
        MongooseModule.forFeature([
            { name: PostRead.name, schema: PostReadSchema },
            { name: UserRead.name, schema: UserReadSchema },
        ]),
        ElasticsearchInfraModule,
    ],
    providers: [
        PostSearchRepo,
        PostReadMongoRepository,
        UserReadMongoRepository,
        ReindexPostsCommand,
        BackfillPostAuthorCommand,
    ],
})
export class CliModule {}
