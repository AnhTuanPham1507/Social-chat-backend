import { Injectable, Inject } from '@nestjs/common';

import {
    IUploadFileService,
    UPLOAD_FILE_SERVICE_TOKEN,
} from '../application/contracts/upload-file-service.contract';
import { AssetEntity } from '../domain/entities/asset/asset.entity';
import { CreateAssetPayloadDTO } from '../driving-adapters/dtos/create-asset-payload.dto';

import {
    ASSET_REPO_TOKEN,
    IAssetRepository,
} from './contracts/asset-repository.contract';

export interface IAssetService {
    createAsset(payload: CreateAssetPayloadDTO): Promise<AssetEntity>;
}

@Injectable()
export class AssetService implements IAssetService {
    constructor(
        @Inject(UPLOAD_FILE_SERVICE_TOKEN)
        private readonly uploadFileService: IUploadFileService,
        @Inject(ASSET_REPO_TOKEN)
        private readonly assetRepository: IAssetRepository,
    ) {}

    public async createAsset(
        payload: CreateAssetPayloadDTO,
    ): Promise<AssetEntity> {
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
