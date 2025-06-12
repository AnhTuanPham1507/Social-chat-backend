import { IMinioConfig } from './interfaces/minio-config.interface';

export const getMinioConfig = (): IMinioConfig => ({
    url: process.env.MINIO_URL,
    port: Number.parseInt(process.env.MINIO_PORT),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    ssl: Boolean(process.env.MINIO_SSL),
});
