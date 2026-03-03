import { IMinioConfig } from '@social-chat/common';
import { Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';

import { MINIO_CLIENT_TOKEN, MINIO_CONFIG_TOKEN } from './const';

export interface PresignedPostResult {
    postURL: string;
    formData: Record<string, string>;
}

@Injectable()
export class MinioService {
    private readonly _baseUrl: string;

    constructor(
        @Inject(MINIO_CLIENT_TOKEN)
        private readonly _minioClient: Minio.Client,
        @Inject(MINIO_CONFIG_TOKEN)
        private readonly _minioConfig: IMinioConfig,
    ) {
        this._baseUrl = `${this._minioConfig.ssl ? 'https' : 'http'}://${this._minioConfig.url}:${this._minioConfig.port}`;
    }

    /**
     * Ensures bucket exists, creates if not.
     */
    public async ensureBucket(bucketName: string): Promise<void> {
        const exists = await this._minioClient.bucketExists(bucketName);
        if (!exists) {
            await this._minioClient.makeBucket(bucketName, 'us-east-1');
        }
    }

    /**
     * Generates a pre-signed POST policy for direct client-to-MinIO upload.
     * The policy enforces constraints (content type, size range) server-side —
     * MinIO will reject uploads that violate these conditions.
     */
    public async generatePresignedPost(params: {
        bucket: string;
        key: string;
        contentType: string;
        maxSize: number;
        expiresInSeconds?: number;
    }): Promise<PresignedPostResult> {
        await this.ensureBucket(params.bucket);

        const policy = new Minio.PostPolicy();
        policy.setBucket(params.bucket);
        policy.setKey(params.key);
        policy.setContentType(params.contentType);
        policy.setContentLengthRange(0, params.maxSize);

        const expires = new Date();
        expires.setSeconds(
            expires.getSeconds() + (params.expiresInSeconds ?? 600),
        );
        policy.setExpires(expires);

        const { postURL, formData } =
            await this._minioClient.presignedPostPolicy(policy);

        return { postURL, formData };
    }

    /**
     * Checks whether an object exists in a bucket.
     * Used to verify the client actually uploaded the file before confirming.
     */
    public async verifyFileExists(
        bucket: string,
        key: string,
    ): Promise<boolean> {
        try {
            await this._minioClient.statObject(bucket, key);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Deletes an object from a bucket.
     */
    public async deleteFile(bucket: string, key: string): Promise<void> {
        await this._minioClient.removeObject(bucket, key);
    }

    /**
     * Builds a public URL for an object.
     * Requires the bucket to have a public-read policy.
     * This is synchronous — just string concatenation, no MinIO call.
     */
    public getPublicUrl(bucket: string, key: string): string {
        return `${this._baseUrl}/${bucket}/${key}`;
    }
}
