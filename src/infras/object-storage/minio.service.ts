import { Injectable } from "@nestjs/common";
import * as Minio from 'minio';
import { IObjectStorageService, IUploadFilePayload, IUploadFileResponsePayload } from "src/core/interfaces/object-storage-service.interface";
@Injectable()
export class MinioService implements IObjectStorageService {
    private readonly minioClient: Minio.Client;

    constructor() {
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_HOST,
            port: Number.parseInt(process.env.MINIO_PORT) || 9000,
            useSSL: process.env.NODE_ENV === 'production',
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        });
    }

    private async ensureBucketExists(
        bucketName: string,
        region?: string,
    ): Promise<void> {
        const existedBucket = await this.minioClient.bucketExists(bucketName);
        if (!existedBucket)
            await this.minioClient.makeBucket(bucketName, region);
    }

    async uploadFile(
        payload: IUploadFilePayload
    ): Promise<IUploadFileResponsePayload> {
        const { fileBuffer, fileName, fileSize, mimetype} = payload;
        const BUCKET_NAME = 'bucketname';
        const region = 'us-east-1';

        await this.ensureBucketExists(BUCKET_NAME, region);

        const metaData = {
            'Content-Type': mimetype,
        };

        await this.minioClient.putObject(
            BUCKET_NAME,
            fileName,
            fileBuffer,
            fileSize,
            metaData,
        );

        const path = `${process.env.MINIO_BASE_URL}/${BUCKET_NAME}/${fileName}`;

        return { path };
    }
}