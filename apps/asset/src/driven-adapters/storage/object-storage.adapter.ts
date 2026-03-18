import { Injectable } from '@nestjs/common';
import { R2StorageService } from '@social-chat/infrastructure';
import {
  CompletedPartInput,
  IObjectStorageService,
  PresignedPutParams,
} from '@application/contracts/object-storage-service.contract';

@Injectable()
export class ObjectStorageAdapter implements IObjectStorageService {
  constructor(private readonly _r2StorageService: R2StorageService) {}

  async generatePresignedPutUrl(
    params: PresignedPutParams,
  ): Promise<string> {
    return this._r2StorageService.generatePresignedUploadUrl(
      params.key,
      params.contentType,
      params.contentLength,
      params.expiresInSeconds,
    );
  }

  async generatePresignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    return this._r2StorageService.generatePresignedDownloadUrl(
      key,
      expiresInSeconds,
    );
  }

  async verifyFileExists(key: string): Promise<boolean> {
    return this._r2StorageService.objectExists(key);
  }

  async deleteFile(key: string): Promise<void> {
    return this._r2StorageService.deleteObject(key);
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    return this._r2StorageService.deleteByPrefix(prefix);
  }

  getPublicUrl(key: string): string {
    return this._r2StorageService.getPublicUrl(key);
  }

  // Multipart upload

  async initiateMultipartUpload(
    key: string,
    contentType: string,
  ): Promise<string> {
    return this._r2StorageService.initiateMultipartUpload(key, contentType);
  }

  async generatePresignedPartUrls(
    key: string,
    uploadId: string,
    totalParts: number,
  ): Promise<{ partNumber: number; url: string }[]> {
    return this._r2StorageService.generatePresignedPartUrls(
      key,
      uploadId,
      totalParts,
    );
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: CompletedPartInput[],
  ): Promise<void> {
    return this._r2StorageService.completeMultipartUpload(
      key,
      uploadId,
      parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
    );
  }

  async abortMultipartUpload(
    key: string,
    uploadId: string,
  ): Promise<void> {
    return this._r2StorageService.abortMultipartUpload(key, uploadId);
  }
}
