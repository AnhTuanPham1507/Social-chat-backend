import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from 'minio';
import { IMinioConfig, MINIO_CONFIG } from "@configs/interfaces/minio-config.interface";


export const MINIO_CLIENT_TOKEN = 'MINIO_INJECT_TOKEN';

export const MinioClientProvider: Provider = {
    inject: [ConfigService],
    provide: MINIO_CLIENT_TOKEN,
    useFactory: async (configService: ConfigService):
    Promise<Minio.Client> => {
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
}