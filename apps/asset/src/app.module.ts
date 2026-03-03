import { randomUUID } from 'crypto';

import { configs, REQ_ID_HEADER } from '@social-chat/common';
import { DATABASE_CONFIG, IDatabaseConfig } from '@social-chat/common';
import { IMinioConfig, MINIO_CONFIG } from '@social-chat/common';
import { DatabaseModule } from '@social-chat/infrastructure';
import { LogModule } from '@social-chat/infrastructure';
import { MinioModule } from '@social-chat/infrastructure';
import { Module } from '@nestjs/common/decorators';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';

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
    MinioModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get<IMinioConfig>(MINIO_CONFIG);
      },
    }),
    AssetModule,
  ],
})
export class AppModule {}
