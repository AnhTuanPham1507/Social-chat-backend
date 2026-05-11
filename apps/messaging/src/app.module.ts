import { randomUUID } from 'crypto';
import { resolve } from 'path';

import {
    DATABASE_CONFIG,
    IDatabaseConfig,
    IKafkaAppConfig,
    IMongoConfig,
    KAFKA_CONFIG,
    MONGO_CONFIG,
    SOCIAL_CHAT_KEYCLOAK_CONFIG,
    REDIS_CONFIG,
    SHARED_STORE_CONFIG,
    REQ_ID_HEADER,
    configs,
} from '@social-chat/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ClsModule } from 'nestjs-cls';

import {
    PostgresModule,
    LogModule,
    MessagingModule as KafkaMessagingModule,
    REDIS_SERVICE_TOKEN,
    RedisModule,
} from '@social-chat/infrastructure';

import { MessagingModule } from './messaging.module';
import { LibAuthModule, RefreshTokenMiddleware } from '@social-chat/shared-libs';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: [
                resolve(__dirname, '..', '..', '..', 'config', '.env.messaging'),
                resolve(__dirname, '..', '..', '..', 'config', '.env.common'),
            ],
            load: [configs],
        }),
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
                saveReq: true,
                generateId: true,
                idGenerator: (req: Request) => {
                    return req.headers[REQ_ID_HEADER] ?? (randomUUID() as any);
                },
            },
        }),
        EventEmitterModule.forRoot(),
        RedisModule.registerAsync([
            {
                serviceToken: REDIS_SERVICE_TOKEN.CACHE_SERVICE,
                configKey: REDIS_CONFIG,
            },
            {
                serviceToken: REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE,
                configKey: SHARED_STORE_CONFIG,
            },
        ]),
        LogModule,
        PostgresModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return configService.get<IDatabaseConfig>(DATABASE_CONFIG);
            },
        }),
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const mongoConfig = configService.get<IMongoConfig>(MONGO_CONFIG);
                return { uri: mongoConfig.uri };
            },
        }),
        KafkaMessagingModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return configService.get<IKafkaAppConfig>(KAFKA_CONFIG);
            },
        }),
        PassportModule,
        MessagingModule,
        LibAuthModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const keycloakConfig = configService.get(SOCIAL_CHAT_KEYCLOAK_CONFIG);
                return { config: keycloakConfig };
            },
        }),
    ],
    providers: [],
    exports: [MessagingModule],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RefreshTokenMiddleware).forRoutes('*');
    }
}
