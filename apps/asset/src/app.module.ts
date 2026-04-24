import { randomUUID } from 'crypto';
import { resolve } from 'path';

import { configs, REQ_ID_HEADER } from '@social-chat/common';
import { DATABASE_CONFIG, IDatabaseConfig } from '@social-chat/common';
import { IKafkaAppConfig, KAFKA_CONFIG } from '@social-chat/common';
import { IR2Config, R2_CONFIG } from '@social-chat/common';
import { SOCIAL_CHAT_KEYCLOAK_CONFIG } from '@social-chat/common';
import { PostgresModule, REDIS_SERVICE_TOKEN, RedisModule } from '@social-chat/infrastructure';
import { LogModule } from '@social-chat/infrastructure';
import { MessagingModule, ObjectStorageModule } from '@social-chat/infrastructure';
import { REDIS_CONFIG, SHARED_STORE_CONFIG } from '@social-chat/common';
import { Module } from '@nestjs/common/decorators';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PassportModule } from '@nestjs/passport';
import { ClsModule } from 'nestjs-cls';
import { LibAuthModule, RefreshTokenMiddleware } from '@social-chat/shared-libs';

import { AssetModule } from './asset.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        resolve(__dirname, '..', '..', '..', 'config', '.env.asset'),
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
    ObjectStorageModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get<IR2Config>(R2_CONFIG);
      },
    }),
    MessagingModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get<IKafkaAppConfig>(KAFKA_CONFIG);
      },
    }),
    PassportModule,
    LibAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const keycloakConfig = configService.get(SOCIAL_CHAT_KEYCLOAK_CONFIG);
        return { config: keycloakConfig };
      },
    }),
    AssetModule,
  ],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RefreshTokenMiddleware).forRoutes('*');
  }
}
