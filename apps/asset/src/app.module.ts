import { randomUUID } from 'crypto';

import { configs, REQ_ID_HEADER } from '@social-chat/common';
import { DATABASE_CONFIG, IDatabaseConfig } from '@social-chat/common';
import { IKafkaAppConfig, KAFKA_CONFIG } from '@social-chat/common';
import { IR2Config, R2_CONFIG } from '@social-chat/common';
import { SOCIAL_CHAT_KEYCLOAK_CONFIG } from '@social-chat/common';
import { DatabaseModule } from '@social-chat/infrastructure';
import { LogModule } from '@social-chat/infrastructure';
import { MessagingModule, ObjectStorageModule } from '@social-chat/infrastructure';
import { Module } from '@nestjs/common/decorators';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ClsModule } from 'nestjs-cls';
import { LibAuthModule } from '@social-chat/shared-libs';

import { AssetModule } from './asset.module';

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
    LogModule,
    DatabaseModule.forRootAsync({
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
})
export class AppModule {}
