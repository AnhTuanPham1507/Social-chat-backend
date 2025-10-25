import {
    IMinioConfig,
    MINIO_CONFIG,
} from '@common/configs/interfaces/minio-config.interface';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export const MINIO_CLIENT_TOKEN = 'MINIO_INJECT_TOKEN';

export const MinioClientProvider: Provider = {
    inject: [ConfigService],
    provide: MINIO_CLIENT_TOKEN,
    useFactory: (configService: ConfigService): Minio.Client => {
        const minioConfig = configService.get<IMinioConfig>(MINIO_CONFIG);

        const client = new Minio.Client({
            endPoint: minioConfig.url,
            port: minioConfig.port,
            accessKey: minioConfig.accessKey,
            secretKey: minioConfig.secretKey,
            useSSL: minioConfig.ssl,
        });
        return client;
    },
};
