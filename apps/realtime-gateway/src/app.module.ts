import { randomUUID } from 'crypto';
import { resolve } from 'path';

import {
    IKafkaAppConfig,
    KAFKA_CONFIG,
    REQ_ID_HEADER,
    SHARED_STORE_CONFIG,
    configs,
} from '@social-chat/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PassportModule } from '@nestjs/passport';
import { ClsModule } from 'nestjs-cls';

import {
    LogModule,
    MessagingModule as KafkaMessagingModule,
    REDIS_SERVICE_TOKEN,
    RedisModule,
} from '@social-chat/infrastructure';

import { RealtimeGatewayModule } from './realtime-gateway.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: [
                resolve(__dirname, '..', '..', '..', 'config', '.env.realtime-gateway'),
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
                serviceToken: REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE,
                configKey: SHARED_STORE_CONFIG,
            },
        ]),
        LogModule,
        KafkaMessagingModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return configService.get<IKafkaAppConfig>(KAFKA_CONFIG);
            },
        }),
        PassportModule,
        RealtimeGatewayModule,
    ],
    providers: [],
    exports: [RealtimeGatewayModule],
})
export class AppModule {}
