import { randomUUID } from 'crypto';

import { REQ_ID_HEADER } from '@commons/constants/app.const';
import { LogModule } from '@infras/log/log.module';
import { MinioModule } from '@infras/minio/minio.module';
import { AssetModule } from '@modules/asset/asset.module';
import { Module } from '@nestjs/common/decorators';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';

import { configs } from './configs';
import { AuthModule } from './modules/auth/auth.module';
import { PostgresModule } from '@infras/postgres/postgres.module';

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
                mount: false,
                saveReq: true,
                generateId: true,
                idGenerator: (req: Request) => {
                    return req.headers[REQ_ID_HEADER] ?? (randomUUID() as any);
                },
            },
        }),
        LogModule,
        PostgresModule,
        MinioModule,
        AuthModule,
        AssetModule,
    ],
    providers: [],
})
export class AppModule {}
