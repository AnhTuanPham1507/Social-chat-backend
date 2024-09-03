import { Injectable } from "@nestjs/common";
import * as Minio from 'minio';
import { MimeType } from "src/core/enums/mime-type.enum";
import { IObjectStorageService } from "src/core/interfaces/object-storage-service.interface";
@Injectable()
export class MinioService implements IObjectStorageService{
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
    
    private async findOrCreateBucket(bucketName: string, region?: string): Promise<void> {
        const existedBucket = await this.minioClient.bucketExists(bucketName);
        if (!existedBucket) this.minioClient.makeBucket(bucketName, region);
    }

    async uploadFile(fileBuffer: Buffer, fileName: string, fileSize: number, mimetype: MimeType): Promise<void> {
        await this.findOrCreateBucket('bucketName', 'us-east-1');

        const metaData = {
            'Content-Type': mimetype,
        };

        await this.minioClient.putObject(
            'bucketName',
            fileName,
            fileBuffer,
            fileSize,
            metaData,
        );
    }
}