export const MINIO_CONFIG = 'MINIO_CONFIG';

export interface IMinioConfig {
    url: string;
    port: number;
    accessKey: string;
    secretKey: string;
    ssl: boolean;
}