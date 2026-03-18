import { randomUUID } from 'crypto';

import { DATABASE_CONFIG, IDatabaseConfig, IKafkaAppConfig, KAFKA_CONFIG, SOCIAL_CHAT_KEYCLOAK_CONFIG } from '@social-chat/common';
import { REDIS_CONFIG, SHARED_STORE_CONFIG } from '@social-chat/common';
import { REQ_ID_HEADER } from '@social-chat/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ClsModule } from 'nestjs-cls';

import { configs } from '@social-chat/common';
import { DatabaseModule, LogModule, MessagingModule, REDIS_SERVICE_TOKEN, RedisModule } from '@social-chat/infrastructure';

import { FeedModule } from './feed.module';
import { LibAuthModule } from '@social-chat/shared-libs';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: `.env`,
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
        DatabaseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return configService.get<IDatabaseConfig>(DATABASE_CONFIG);
            },
        }),
        MessagingModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return configService.get<IKafkaAppConfig>(KAFKA_CONFIG);
            },
        }),
        PassportModule,
        FeedModule,
        LibAuthModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const keycloakConfig = configService.get(SOCIAL_CHAT_KEYCLOAK_CONFIG);
                return { config: keycloakConfig };
            },
        }),
    ],
    providers: [],
})
export class AppModule {}
