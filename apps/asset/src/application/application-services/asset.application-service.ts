import { randomUUID } from 'crypto';
import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AssetEntity,
  ASSET_PURPOSE,
  ASSET_STATUS,
  ASSET_TYPE,
  DOMAIN_EVENT_BUS_TOKEN,
  IDomainEventBus,
  MIME_TYPE,
  type ImageVariantDefinition,
} from '@social-chat/domain';
import { IR2Config, R2_CONFIG } from '@social-chat/common';
import {
  ASSET_REPO_TOKEN,
  IAssetRepository,
} from '@application/contracts/asset-repository.contract';
import {
  OBJECT_STORAGE_SERVICE_TOKEN,
  IObjectStorageService,
} from '@application/contracts/object-storage-service.contract';
import { AssetPathService } from './asset-path.service';
import { ImageProcessingApplicationService } from './image-processing.application-service';

export const ASSET_APPLICATION_SERVICE_TOKEN = Symbol(
  'ASSET_APPLICATION_SERVICE',
);

export interface PresignUploadInput {
  purpose: ASSET_PURPOSE;
  mimeType: MIME_TYPE;
  originalName: string;
  size: number;
  createdBy: string;
}

export interface PresignUploadOutput {
  assetId: string;
  uploadUrl: string;
  key: string;
}

export interface ConfirmUploadOutput {
  assetId: string;
  key: string;
  url: string;
}

export interface ValidateAssetOutput {
  valid: boolean;
  assetId: string;
  key: string;
}

export interface InitiateMultipartUploadInput {
  purpose: ASSET_PURPOSE;
  mimeType: MIME_TYPE;
  originalName: string;
  size: number;
  totalParts: number;
  createdBy: string;
}

export interface InitiateMultipartUploadOutput {
  assetId: string;
  key: string;
  uploadId: string;
  partUrls: { partNumber: number; url: string }[];
}

export interface CompleteMultipartUploadInput {
  assetId: string;
  uploadId: string;
  parts: { partNumber: number; etag: string }[];
}

export interface ResizeImageInput {
  assetId: string;
  variant: Partial<ImageVariantDefinition>;
}

export interface ResizeImageOutput {
  url: string;
  variantKey: string;
}

export interface IAssetApplicationService {
  presignUpload(input: PresignUploadInput): Promise<PresignUploadOutput>;
  bulkPresignUpload(inputs: PresignUploadInput[]): Promise<PresignUploadOutput[]>;
  confirmUpload(assetId: string): Promise<ConfirmUploadOutput>;
  initiateMultipartUpload(input: InitiateMultipartUploadInput): Promise<InitiateMultipartUploadOutput>;
  completeMultipartUpload(input: CompleteMultipartUploadInput): Promise<ConfirmUploadOutput>;
  abortMultipartUpload(assetId: string, uploadId: string): Promise<void>;
  resizeImage(input: ResizeImageInput): Promise<ResizeImageOutput>;
  deleteAsset(assetId: string, userId: string): Promise<void>;
}

@Injectable()
export class AssetApplicationService implements IAssetApplicationService {
  private readonly _bucket: string;

  constructor(
    @Inject(ASSET_REPO_TOKEN)
    private readonly _assetRepo: IAssetRepository,
    @Inject(OBJECT_STORAGE_SERVICE_TOKEN)
    private readonly _storageService: IObjectStorageService,
    @Inject(DOMAIN_EVENT_BUS_TOKEN)
    private readonly _domainEventBus: IDomainEventBus,
    private readonly _assetPathService: AssetPathService,
    private readonly _imageProcessingService: ImageProcessingApplicationService,
    private readonly _configService: ConfigService,
  ) {
    this._bucket = this._configService.get<IR2Config>(R2_CONFIG).bucket;
  }

  async presignUpload(input: PresignUploadInput): Promise<PresignUploadOutput> {
    const assetId = randomUUID();
    const assetType = this._assetPathService.deriveAssetType(input.mimeType);
    const key = this._assetPathService.generateOriginalKey(
      assetId,
      input.createdBy,
      input.purpose,
      input.mimeType,
      input.originalName,
    );

    // Create domain entity (validates size, sets PENDING status)
    const asset = AssetEntity.create({
      id: assetId,
      bucket: this._bucket,
      key,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      assetType,
      purpose: input.purpose,
      createdBy: input.createdBy,
    });

    // Persist asset with PENDING status
    await this._assetRepo.insert(asset);

    // Generate pre-signed PUT URL for direct upload
    const uploadUrl = await this._storageService.generatePresignedPutUrl({
      key,
      contentType: input.mimeType,
      contentLength: input.size,
    });

    return {
      assetId: asset.id,
      uploadUrl,
      key,
    };
  }

  async bulkPresignUpload(
    inputs: PresignUploadInput[],
  ): Promise<PresignUploadOutput[]> {
    return Promise.all(inputs.map((input) => this.presignUpload(input)));
  }

  async confirmUpload(assetId: string): Promise<ConfirmUploadOutput> {
    const asset = await this._assetRepo.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    // Prevent double-confirm — idempotent response if already past PENDING
    if (asset.status !== ASSET_STATUS.PENDING) {
      throw new BadRequestException('Asset already confirmed');
    }

    // Verify the file was actually uploaded to storage
    const exists = await this._storageService.verifyFileExists(asset.key);
    if (!exists) {
      throw new NotFoundException(
        `File not found in storage. Upload may not be complete.`,
      );
    }

    // Transition to CONFIRMED — emits AssetConfirmedEvent
    asset.confirm();
    await this._assetRepo.update(asset);

    // Publish domain events (in-process; AssetConfirmedListener triggers variant/transcoding)
    const events = asset.publishEvents();
    await this._domainEventBus.publishAll(events);

    return {
      assetId: asset.id,
      key: asset.key,
      url: this._storageService.getPublicUrl(asset.key),
    };
  }

  async initiateMultipartUpload(
    input: InitiateMultipartUploadInput,
  ): Promise<InitiateMultipartUploadOutput> {
    const assetId = randomUUID();
    const assetType = this._assetPathService.deriveAssetType(input.mimeType);
    const key = this._assetPathService.generateOriginalKey(
      assetId,
      input.createdBy,
      input.purpose,
      input.mimeType,
      input.originalName,
    );

    // Create domain entity (validates size, sets PENDING status)
    const asset = AssetEntity.create({
      id: assetId,
      bucket: this._bucket,
      key,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      assetType,
      purpose: input.purpose,
      createdBy: input.createdBy,
    });

    await this._assetRepo.insert(asset);

    // Initiate multipart upload in R2
    const uploadId = await this._storageService.initiateMultipartUpload(
      key,
      input.mimeType,
    );

    // Generate presigned URLs for all parts
    const partUrls = await this._storageService.generatePresignedPartUrls(
      key,
      uploadId,
      input.totalParts,
    );

    return {
      assetId: asset.id,
      key,
      uploadId,
      partUrls,
    };
  }

  async completeMultipartUpload(
    input: CompleteMultipartUploadInput,
  ): Promise<ConfirmUploadOutput> {
    const asset = await this._assetRepo.findById(input.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset ${input.assetId} not found`);
    }

    // Complete the multipart upload in R2 (combines all parts into one object)
    await this._storageService.completeMultipartUpload(
      asset.key,
      input.uploadId,
      input.parts,
    );

    const result = await this.confirmUpload(asset.id);
  
    return result;
  }

  async abortMultipartUpload(
    assetId: string,
    uploadId: string,
  ): Promise<void> {
    const asset = await this._assetRepo.findById(assetId);
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    // Abort the multipart upload (cleans up uploaded parts in R2)
    await this._storageService.abortMultipartUpload(asset.key, uploadId);

    // Delete the PENDING asset record
    await this._assetRepo.delete(assetId);
  }

  async resizeImage(input: ResizeImageInput): Promise<ResizeImageOutput> {
    const asset = await this._assetRepo.findById(input.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset ${input.assetId} not found`);
    }

    if (!asset.isConfirmed) {
      throw new BadRequestException('Asset must be confirmed before resizing');
    }

    if (asset.assetType !== ASSET_TYPE.IMAGE) {
      throw new BadRequestException('Only image assets can be resized');
    }

    // No variant options → return original URL directly
    if (!input.variant) {
      return {
        url: this._storageService.getPublicUrl(asset.key),
        variantKey: asset.key,
      };
    }

    return this._imageProcessingService.resizeImage(
      asset.key,
      input.variant,
    );
  }

  async deleteAsset(assetId: string, userId: string): Promise<void> {
    const asset = await this._assetRepo.findById(assetId);

    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    if (asset.createdBy !== userId) {
      throw new ForbiddenException(`You do not own this asset`);
    }

    // Delete original file and all variants from storage
    const prefix = this._assetPathService.generateVariantPrefix(asset.key);
    await this._storageService.deleteByPrefix(prefix);

    // Delete asset record
    await this._assetRepo.delete(assetId);
  }
}
