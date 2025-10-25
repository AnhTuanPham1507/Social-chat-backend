import { randomUUID } from 'crypto';

import { REQ_ID_HEADER } from '@common/constants/app.const';
import { DatabaseModule } from '@infras/database/database.module';
import { ExternalServiceModule } from '@infras/external-services';
import { LogModule } from '@infras/log/log.module';
import { MinioModule } from '@infras/minio/minio.module';
import { AssetModule } from '@modules/asset/asset.module';
import { Module } from '@nestjs/common/decorators';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';

import { configs } from './common/configs';
import { AuthModule } from './modules/auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: `./env/.env`,
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
        DatabaseModule,
        MinioModule,
        AuthModule,
        AssetModule,
        ExternalServiceModule,
    ],
    providers: [],
})
export class AppModule {}
