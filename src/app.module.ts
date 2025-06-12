import { ConfigModule } from '@nestjs/config';

import { PostgresModule } from './infras/postgres/postgres.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssetModule } from '@modules/asset/asset.module';
import { configs } from './configs';
import { MinioModule } from '@infras/minio/minio.module';
import { ClsModule } from 'nestjs-cls';
import { REQ_ID_HEADER } from '@commons/constants/app.const';
import { randomUUID } from 'crypto';
import { Module } from '@nestjs/common/decorators';
import { LogModule } from '@infras/log/log.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: `.env`,
            load: [configs]
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
            }
        }),
        LogModule,
        PostgresModule,
        MinioModule,
        AuthModule,
        AssetModule
    ],
    providers: [],
})
export class AppModule {}
