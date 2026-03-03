import { DynamicModule, Global, Module } from '@nestjs/common';
import { IMinioConfig } from '@social-chat/common';
import * as Minio from 'minio';

import { MinioService } from './minio.service';
import { MINIO_CLIENT_TOKEN, MINIO_CONFIG_TOKEN } from './const';

export interface MinioModuleAsyncOptions {
    /**
     * Factory function to provide MinIO configuration
     */
    useFactory: (...args: any[]) => Promise<IMinioConfig> | IMinioConfig;
    /**
     * Optional dependencies to inject into the factory function
     */
    inject?: any[];
}

@Global()
@Module({})
export class MinioModule {
    /**
     * Register the module with async configuration from consuming app
     */
    public static forRootAsync(
        options: MinioModuleAsyncOptions,
    ): DynamicModule {
        const minioConfigProvider = {
            provide: MINIO_CONFIG_TOKEN,
            useFactory: options.useFactory,
            inject: options.inject || [],
        };

        const minioClientProvider = {
            provide: MINIO_CLIENT_TOKEN,
            useFactory: (minioConfig: IMinioConfig): Minio.Client => {
                if (!minioConfig) {
                    throw new Error('MinIO configuration not provided');
                }

                const client = new Minio.Client({
                    endPoint: minioConfig.url,
                    port: minioConfig.port,
                    accessKey: minioConfig.accessKey,
                    secretKey: minioConfig.secretKey,
                    useSSL: minioConfig.ssl,
                });
                return client;
            },
            inject: [MINIO_CONFIG_TOKEN],
        };

        return {
            module: MinioModule,
            global: true,
            providers: [minioConfigProvider, minioClientProvider, MinioService],
            exports: [MinioService],
        };
    }
}
