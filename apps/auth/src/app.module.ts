import { randomUUID } from 'crypto';
import { resolve } from 'path';

import { configs, REQ_ID_HEADER } from '@social-chat/common';
import { LogModule } from '@social-chat/infrastructure';
import { Module } from '@nestjs/common/decorators';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';

import { AuthModule } from './auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: [
                resolve(__dirname, '..', '..', '..', 'config', '.env.auth'),
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
        LogModule,
        AuthModule,
    ],
})
export class AppModule {}
