import { randomUUID } from 'crypto';

import { configs, REQ_ID_HEADER } from '@social-chat/common';
import { DATABASE_CONFIG, IDatabaseConfig } from '@social-chat/common';
import { IMinioConfig, MINIO_CONFIG } from '@social-chat/common';
import { DatabaseModule, REDIS_SERVICE_TOKEN, RedisModule } from '@social-chat/infrastructure';
import { LogModule } from '@social-chat/infrastructure';
import { MinioModule } from '@social-chat/infrastructure';
import { Module } from '@nestjs/common/decorators';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';

import { AuthModule } from './auth.module';
import { REDIS_CONFIG, SHARED_STORE_CONFIG } from '@social-chat/common';

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
        MinioModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return configService.get<IMinioConfig>(MINIO_CONFIG);
            },
        }),
        AuthModule,
    ]
})
export class AppModule {}
