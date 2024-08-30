import { Injectable } from "@nestjs/common";
import * as Minio from 'minio';
@Injectable()
export class MinioService {
    private readonly minioClient: Minio.Client;

    constructor() {
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_URL,
            port: Number.parseInt(process.env.MINIO_PORT),
            useSSL: process.env.NODE_ENV === 'production',
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        });
    }

    async uploadFile(file: Express.Multer.File, bucketName: string, region?: string): Promise<void> {
        const existedBucket = await this.minioClient.bucketExists(bucketName);
        if (!existedBucket)
            await this.minioClient.makeBucket(bucketName, region);

        const metaData = {
            'Content-Type': file.mimetype,
        };

        await this.minioClient.putObject(
            bucketName,
            file.originalname,
            file.buffer,
            file.size,
            metaData,
        );
    }
}