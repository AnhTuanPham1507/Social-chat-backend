import { randomUUID } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AssetEntity, ASSET_TYPE, MIME_TYPE } from '@social-chat/domain';
import {
  ASSET_REPO_TOKEN,
  IAssetRepository,
} from '@application/contracts/asset-repository.contract';
import {
  OBJECT_STORAGE_SERVICE_TOKEN,
  IObjectStorageService,
} from '@application/contracts/object-storage-service.contract';

export const ASSET_APPLICATION_SERVICE_TOKEN = Symbol(
  'ASSET_APPLICATION_SERVICE',
);

export interface PresignUploadInput {
  bucket: string;
  folder: string;
  originalName: string;
  mimeType: MIME_TYPE;
  size: number;
}

export interface PresignUploadOutput {
  assetId: string;
  postURL: string;
  formData: Record<string, string>;
  key: string;
}

export interface ConfirmUploadOutput {
  assetId: string;
  bucket: string;
  key: string;
  url: string;
}

export interface IAssetApplicationService {
  presignUpload(input: PresignUploadInput): Promise<PresignUploadOutput>;
  confirmUpload(assetId: string): Promise<ConfirmUploadOutput>;
}

@Injectable()
export class AssetApplicationService implements IAssetApplicationService {
  constructor(
    @Inject(ASSET_REPO_TOKEN)
    private readonly _assetRepo: IAssetRepository,
    @Inject(OBJECT_STORAGE_SERVICE_TOKEN)
    private readonly _storageService: IObjectStorageService,
  ) {}

  async presignUpload(input: PresignUploadInput): Promise<PresignUploadOutput> {
    // Generate a unique object key: folder/uuid-timestamp.ext
    const ext = this._getExtension(input.originalName);
    const key = `${input.folder}/${randomUUID()}-${Date.now()}${ext}`;

    // Derive asset type from mime type
    const assetType = this._deriveAssetType(input.mimeType);

    // Create domain entity (validates size, sets PENDING status)
    const asset = AssetEntity.create({
      bucket: input.bucket,
      key,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      assetType,
    });

    // Persist asset with PENDING status
    await this._assetRepo.insert(asset);

    // Generate pre-signed POST for direct upload
    const presigned = await this._storageService.generatePresignedPost({
      bucket: input.bucket,
      key,
      contentType: input.mimeType,
      maxSize: input.size,
    });

    return {
      assetId: asset.id,
      postURL: presigned.postURL,
      formData: presigned.formData,
      key,
    };
  }

  async confirmUpload(assetId: string): Promise<ConfirmUploadOutput> {
    const asset = await this._assetRepo.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    if (asset.isConfirmed) {
      return {
        assetId: asset.id,
        bucket: asset.bucket,
        key: asset.key,
        url: this._storageService.getPublicUrl(asset.bucket, asset.key),
      };
    }

    // Verify the file was actually uploaded to storage
    const exists = await this._storageService.verifyFileExists(
      asset.bucket,
      asset.key,
    );
    if (!exists) {
      throw new NotFoundException(
        `File not found in storage. Upload may not be complete.`,
      );
    }

    // Transition to CONFIRMED
    asset.confirm();
    await this._assetRepo.update(asset);

    return {
      assetId: asset.id,
      bucket: asset.bucket,
      key: asset.key,
      url: this._storageService.getPublicUrl(asset.bucket, asset.key),
    };
  }

  private _getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot) : '';
  }

  private _deriveAssetType(mimeType: MIME_TYPE): ASSET_TYPE {
    if (mimeType.startsWith('image/')) return ASSET_TYPE.IMAGE;
    if (mimeType.startsWith('video/')) return ASSET_TYPE.VIDEO;
    if (mimeType.startsWith('audio/')) return ASSET_TYPE.AUDIO;
    return ASSET_TYPE.DOCUMENT;
  }
}
