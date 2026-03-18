import { IR2Config } from '@social-chat/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    type HeadObjectCommandOutput,
    type PutObjectCommandInput,
    type CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { R2_CONFIG_TOKEN, S3_CLIENT_TOKEN } from './const';

export interface HeadObjectResult {
    exists: boolean;
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
    etag?: string;
}

@Injectable()
export class R2StorageService {
    private readonly _logger = new Logger(R2StorageService.name);
    private readonly _bucket: string;
    private readonly _publicUrl: string;

    constructor(
        @Inject(S3_CLIENT_TOKEN)
        private readonly _s3Client: S3Client,
        @Inject(R2_CONFIG_TOKEN)
        private readonly _r2Config: IR2Config,
    ) {
        this._bucket = this._r2Config.bucket;
        this._publicUrl = this._r2Config.publicUrl;
    }

    public getBucket(): string {
        return this._bucket;
    }

    /**
     * Generate presigned PUT URL for file upload.
     *
     * Both Content-Type and Content-Length are signed into the URL when provided.
     * R2 will reject uploads where these headers don't match exactly
     * (SignatureDoesNotMatch error).
     */
    public async generatePresignedUploadUrl(
        objectKey: string,
        contentType?: string,
        contentLength?: number,
        expiresIn: number = 600,
    ): Promise<string> {
        const commandInput: PutObjectCommandInput = {
            Bucket: this._bucket,
            Key: objectKey,
        };
        const signableHeaders = new Set<string>();

        if (contentType) {
            commandInput.ContentType = contentType;
            signableHeaders.add('content-type');
        }
        if (contentLength) {
            commandInput.ContentLength = contentLength;
            signableHeaders.add('content-length');
        }

        const url = await getSignedUrl(
            this._s3Client,
            new PutObjectCommand(commandInput),
            { expiresIn, signableHeaders },
        );

        this._logger.debug(
            `Generated presigned upload URL for ${objectKey}, type=${contentType}, size=${contentLength}, expires in ${expiresIn}s`,
        );
        return url;
    }

    /**
     * Generate presigned URL for file download.
     * Used by external processors (imgproxy) to access source files.
     */
    public async generatePresignedDownloadUrl(
        objectKey: string,
        expiresIn: number = 3600,
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this._bucket,
            Key: objectKey,
        });

        const url = await getSignedUrl(this._s3Client, command, { expiresIn });
        this._logger.debug(
            `Generated presigned download URL for ${objectKey}, expires in ${expiresIn}s`,
        );
        return url;
    }

    /**
     * Check if an object exists in R2.
     */
    public async objectExists(objectKey: string): Promise<boolean> {
        try {
            await this._s3Client.send(
                new HeadObjectCommand({
                    Bucket: this._bucket,
                    Key: objectKey,
                }),
            );
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get object metadata (HEAD request).
     */
    public async headObject(objectKey: string): Promise<HeadObjectResult> {
        try {
            const response: HeadObjectCommandOutput = await this._s3Client.send(
                new HeadObjectCommand({
                    Bucket: this._bucket,
                    Key: objectKey,
                }),
            );

            return {
                exists: true,
                contentType: response.ContentType,
                contentLength: response.ContentLength,
                lastModified: response.LastModified,
                etag: response.ETag,
            };
        } catch {
            return { exists: false };
        }
    }

    /**
     * Upload a buffer directly to R2.
     * Used for caching processed variants.
     */
    public async uploadBuffer(
        objectKey: string,
        buffer: Buffer,
        contentType: string,
    ): Promise<void> {
        await this._s3Client.send(
            new PutObjectCommand({
                Bucket: this._bucket,
                Key: objectKey,
                Body: buffer,
                ContentType: contentType,
            }),
        );
        this._logger.debug(`Uploaded buffer to ${objectKey} (${buffer.length} bytes)`);
    }

    /**
     * Delete a single object from R2.
     */
    public async deleteObject(objectKey: string): Promise<void> {
        await this._s3Client.send(
            new DeleteObjectCommand({
                Bucket: this._bucket,
                Key: objectKey,
            }),
        );
        this._logger.debug(`Deleted object: ${objectKey}`);
    }

    /**
     * Delete multiple objects from R2 (bulk delete).
     * Uses S3 DeleteObjects API for efficiency.
     */
    public async deleteObjects(objectKeys: string[]): Promise<void> {
        if (objectKeys.length === 0) {
            return;
        }

        const chunks = this._chunkArray(objectKeys, 1000);

        for (const chunk of chunks) {
            await this._s3Client.send(
                new DeleteObjectsCommand({
                    Bucket: this._bucket,
                    Delete: {
                        Objects: chunk.map((key) => ({ Key: key })),
                        Quiet: true,
                    },
                }),
            );
        }

        this._logger.debug(`Deleted ${objectKeys.length} objects`);
    }

    /**
     * List objects by prefix.
     * Useful for finding all variants or related files.
     */
    public async listObjectsByPrefix(
        prefix: string,
        maxKeys = 1000,
    ): Promise<string[]> {
        const keys: string[] = [];
        let continuationToken: string | undefined;

        do {
            const response = await this._s3Client.send(
                new ListObjectsV2Command({
                    Bucket: this._bucket,
                    Prefix: prefix,
                    MaxKeys: Math.min(maxKeys - keys.length, 1000),
                    ContinuationToken: continuationToken,
                }),
            );

            if (response.Contents) {
                for (const object of response.Contents) {
                    if (object.Key) {
                        keys.push(object.Key);
                    }
                }
            }

            continuationToken = response.IsTruncated
                ? response.NextContinuationToken
                : undefined;
        } while (continuationToken && keys.length < maxKeys);

        return keys;
    }

    /**
     * Delete all objects with a given prefix.
     */
    public async deleteByPrefix(prefix: string): Promise<number> {
        const keys = await this.listObjectsByPrefix(prefix);
        if (keys.length > 0) {
            await this.deleteObjects(keys);
        }
        return keys.length;
    }

    /**
     * Builds a public URL for an object.
     * Uses the configured R2 public URL (custom domain or r2.dev subdomain).
     */
    public getPublicUrl(key: string): string {
        return `${this._publicUrl}/${key}`;
    }

    // ============================================
    // Multipart Upload
    // ============================================

    /**
     * Initiate a multipart upload.
     * Returns an uploadId that must be used for all subsequent part uploads.
     */
    public async initiateMultipartUpload(
        objectKey: string,
        contentType: string,
    ): Promise<string> {
        const response = await this._s3Client.send(
            new CreateMultipartUploadCommand({
                Bucket: this._bucket,
                Key: objectKey,
                ContentType: contentType,
            }),
        );

        this._logger.debug(
            `Initiated multipart upload for ${objectKey}, uploadId=${response.UploadId}`,
        );
        return response.UploadId;
    }

    /**
     * Generate presigned URLs for uploading individual parts.
     * S3 part numbers are 1-based (1 to 10,000).
     */
    public async generatePresignedPartUrls(
        objectKey: string,
        uploadId: string,
        totalParts: number,
        expiresIn: number = 3600,
    ): Promise<{ partNumber: number; url: string }[]> {
        const partUrls: { partNumber: number; url: string }[] = [];

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const command = new UploadPartCommand({
                Bucket: this._bucket,
                Key: objectKey,
                UploadId: uploadId,
                PartNumber: partNumber,
            });
            const url = await getSignedUrl(this._s3Client, command, { expiresIn });
            partUrls.push({ partNumber, url });
        }

        this._logger.debug(
            `Generated ${totalParts} presigned part URLs for ${objectKey}`,
        );
        return partUrls;
    }

    /**
     * Complete a multipart upload by combining all uploaded parts.
     * Parts must include partNumber and ETag (returned by R2 after each part upload).
     */
    public async completeMultipartUpload(
        objectKey: string,
        uploadId: string,
        parts: CompletedPart[],
    ): Promise<void> {
        await this._s3Client.send(
            new CompleteMultipartUploadCommand({
                Bucket: this._bucket,
                Key: objectKey,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
                },
            }),
        );

        this._logger.debug(
            `Completed multipart upload for ${objectKey}, ${parts.length} parts`,
        );
    }

    /**
     * Abort a multipart upload and clean up any uploaded parts.
     * Should be called when the client cancels or the upload times out.
     */
    public async abortMultipartUpload(
        objectKey: string,
        uploadId: string,
    ): Promise<void> {
        await this._s3Client.send(
            new AbortMultipartUploadCommand({
                Bucket: this._bucket,
                Key: objectKey,
                UploadId: uploadId,
            }),
        );

        this._logger.debug(
            `Aborted multipart upload for ${objectKey}, uploadId=${uploadId}`,
        );
    }

    private _chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
