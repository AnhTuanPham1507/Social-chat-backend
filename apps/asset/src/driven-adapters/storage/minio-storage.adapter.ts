import { Injectable } from '@nestjs/common';
import { MinioService } from '@social-chat/infrastructure';
import {
  IObjectStorageService,
  PresignedPostParams,
  PresignedPostResult,
} from '@application/contracts/object-storage-service.contract';

/**
 * Adapter that implements the object storage port using MinIO.
 * If you later switch to AWS S3, you'd create an S3StorageAdapter
 * implementing the same IObjectStorageService interface.
 */
@Injectable()
export class MinioStorageAdapter implements IObjectStorageService {
  constructor(private readonly _minioService: MinioService) {}

  async generatePresignedPost(
    params: PresignedPostParams,
  ): Promise<PresignedPostResult> {
    return this._minioService.generatePresignedPost(params);
  }

  async verifyFileExists(bucket: string, key: string): Promise<boolean> {
    return this._minioService.verifyFileExists(bucket, key);
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    return this._minioService.deleteFile(bucket, key);
  }

  getPublicUrl(bucket: string, key: string): string {
    return this._minioService.getPublicUrl(bucket, key);
  }
}
