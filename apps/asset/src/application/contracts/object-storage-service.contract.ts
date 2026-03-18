/**
 * Port for object storage operations.
 * The application layer depends on this interface, not on R2/S3 directly.
 * This allows swapping storage providers without changing business logic.
 */

export const OBJECT_STORAGE_SERVICE_TOKEN = Symbol('OBJECT_STORAGE_SERVICE');

export interface PresignedPutParams {
  key: string;
  contentType: string;
  contentLength?: number;
  expiresInSeconds?: number;
}

export interface CompletedPartInput {
  partNumber: number;
  etag: string;
}

export interface IObjectStorageService {
  generatePresignedPutUrl(
    params: PresignedPutParams,
  ): Promise<string>;

  generatePresignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  verifyFileExists(key: string): Promise<boolean>;

  deleteFile(key: string): Promise<void>;

  deleteByPrefix(prefix: string): Promise<number>;

  getPublicUrl(key: string): string;

  // Multipart upload
  initiateMultipartUpload(key: string, contentType: string): Promise<string>;

  generatePresignedPartUrls(
    key: string,
    uploadId: string,
    totalParts: number,
  ): Promise<{ partNumber: number; url: string }[]>;

  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPartInput[],
  ): Promise<void>;

  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
}
