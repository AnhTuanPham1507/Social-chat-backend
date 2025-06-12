import { Injectable, Inject } from '@nestjs/common';
import { IUploadFileService, UPLOAD_FILE_SERVICE_TOKEN } from '../application/contracts/upload-file-service.contract';
import { CreateAssetPayloadDTO } from '../driving-adapters/dtos/create-asset-payload.dto';
import { ASSET_REPO_TOKEN, IAssetRepository } from './contracts/asset-repository.contract';
import { AssetEntity } from '../domain/entities/asset/asset.entity';

export interface IAssetService {
  createAsset(payload: CreateAssetPayloadDTO): Promise<AssetEntity>;
}

@Injectable()
export class AssetService implements IAssetService {
  constructor(
    @Inject(UPLOAD_FILE_SERVICE_TOKEN)
    private readonly uploadFileService: IUploadFileService,
    @Inject(ASSET_REPO_TOKEN)
    private readonly assetRepository: IAssetRepository
  ) {}

  async createAsset(payload: CreateAssetPayloadDTO): Promise<AssetEntity> {
    const url = await this.uploadFileService.uploadFile({
      fileBuffer: payload.fileBuffer,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      mimeType: payload.mimeType,
    });

    const asset = AssetEntity.create({
      url,
      name: payload.fileName,
      size: payload.fileSize,
      mimeType: payload.mimeType,
      assetType: payload.assetType,
    });

    await this.assetRepository.insert(asset);

    return asset;
  }
} 