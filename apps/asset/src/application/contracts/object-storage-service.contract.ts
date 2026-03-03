/**
 * Port for object storage operations.
 * The application layer depends on this interface, not on MinIO directly.
 * This allows swapping MinIO for S3, GCS, etc. without changing business logic.
 */

export const OBJECT_STORAGE_SERVICE_TOKEN = Symbol('OBJECT_STORAGE_SERVICE');

export interface PresignedPostParams {
  bucket: string;
  key: string;
  contentType: string;
  maxSize: number;
  expiresInSeconds?: number;
}

export interface PresignedPostResult {
  postURL: string;
  formData: Record<string, string>;
}

export interface IObjectStorageService {
  generatePresignedPost(
    params: PresignedPostParams,
  ): Promise<PresignedPostResult>;

  verifyFileExists(bucket: string, key: string): Promise<boolean>;

  deleteFile(bucket: string, key: string): Promise<void>;

  getPublicUrl(bucket: string, key: string): string;
}
