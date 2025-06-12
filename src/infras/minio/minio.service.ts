import {
    IMinioConfig,
    MINIO_CONFIG,
} from '@configs/interfaces/minio-config.interface';
import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

import { MINIO_CLIENT_TOKEN } from './minio-client';

@Injectable()
export class MinioService {
    private readonly _baseUrl: string;
    constructor(
        @Inject(MINIO_CLIENT_TOKEN)
        private readonly _minioClient: Minio.Client,
        private readonly _configService: ConfigService,
    ) {
        const minioConfig = this._configService.get<IMinioConfig>(MINIO_CONFIG);
        this._baseUrl = `${minioConfig.ssl ? 'https' : 'http'}://${minioConfig.url}:${minioConfig.port}`;
    }

    private async _findOrCreateBucket(
        bucketName: string,
        region?: string,
    ): Promise<void> {
        const existedBucket = await this._minioClient.bucketExists(bucketName);
        if (!existedBucket) {
            this._minioClient.makeBucket(bucketName, region);
        }
    }

    private _getFileUrl(bucketName: string, objectName: string): string {
        return `${this._baseUrl}/${bucketName}/${objectName}`;
    }

    async uploadFile(
        fileBuffer: Buffer,
        fileName: string,
        fileSize: number,
        mimetype: MIME_TYPE,
    ): Promise<string> {
        await this._findOrCreateBucket('test', 'us-east-1');

        const metaData = {
            'Content-Type': mimetype,
        };

        await this._minioClient.putObject(
            'test',
            fileName,
            fileBuffer,
            fileSize,
            metaData,
        );

        return this._getFileUrl('test', fileName);
    }
}
