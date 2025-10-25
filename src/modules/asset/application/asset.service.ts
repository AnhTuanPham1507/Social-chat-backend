import { Injectable, Inject } from '@nestjs/common';

import {
    IUploadFileService,
    UPLOAD_FILE_SERVICE_TOKEN,
} from '../application/contracts/upload-file-service.contract';
import { AssetEntity } from '../domain/entities/asset/asset.entity';
import { CreateAssetPayloadDTO } from '../driving-adapters/dtos/asset.dto';
import { serializeFileName } from '../helpers/asset.helper';
import { ASSET_MAPPER_TOKEN, IAssetMapper } from '../mappers';

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
        @Inject(ASSET_MAPPER_TOKEN)
        private readonly assetMapper: IAssetMapper,
    ) {}

    public async createAsset(
        payload: CreateAssetPayloadDTO,
    ): Promise<AssetEntity> {
        // Serialize the filename to handle special characters and spaces
        const serializedFileName = serializeFileName(payload.fileName);

        const url = await this.uploadFileService.uploadFile({
            fileBuffer: payload.fileBuffer,
            fileName: serializedFileName,
            fileSize: payload.fileSize,
            mimeType: payload.mimeType,
        });

        const asset = this.assetMapper.fromPropsToEntity({
            url,
            name: payload.fileName, // Keep original name for display purposes
            size: payload.fileSize,
            mimeType: payload.mimeType,
            assetType: payload.assetType,
        });

        await this.assetRepository.insert(asset);

        return asset;
    }
}
