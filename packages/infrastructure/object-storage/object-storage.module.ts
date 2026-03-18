import { DynamicModule, Global, Module } from '@nestjs/common';
import { IR2Config } from '@social-chat/common';
import { S3Client } from '@aws-sdk/client-s3';

import { R2StorageService } from './r2-storage.service';
import { R2_CONFIG_TOKEN, S3_CLIENT_TOKEN } from './const';

export interface ObjectStorageModuleAsyncOptions {
    useFactory: (...args: any[]) => Promise<IR2Config> | IR2Config;
    inject?: any[];
}

@Global()
@Module({})
export class ObjectStorageModule {
    public static forRootAsync(
        options: ObjectStorageModuleAsyncOptions,
    ): DynamicModule {
        const r2ConfigProvider = {
            provide: R2_CONFIG_TOKEN,
            useFactory: options.useFactory,
            inject: options.inject || [],
        };

        const s3ClientProvider = {
            provide: S3_CLIENT_TOKEN,
            useFactory: (r2Config: IR2Config): S3Client => {
                if (!r2Config) {
                    throw new Error('R2 configuration not provided');
                }

                return new S3Client({
                    region: 'auto',
                    endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
                    credentials: {
                        accessKeyId: r2Config.accessKeyId,
                        secretAccessKey: r2Config.secretAccessKey,
                    },
                });
            },
            inject: [R2_CONFIG_TOKEN],
        };

        return {
            module: ObjectStorageModule,
            global: true,
            providers: [r2ConfigProvider, s3ClientProvider, R2StorageService],
            exports: [R2StorageService],
        };
    }
}
