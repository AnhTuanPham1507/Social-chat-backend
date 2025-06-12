import {
    AssetService,
    IAssetService,
} from '@modules/asset/application/asset.service';
import { AssetEntity } from '@modules/asset/domain/entities/asset/asset.entity';
import { CreateAssetPayloadDTO } from '@modules/asset/driving-adapters/dtos/create-asset-payload.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetServiceAdapter implements IAssetService {
    constructor(private readonly _assetService: AssetService) {}

    async createAsset(payload: CreateAssetPayloadDTO): Promise<AssetEntity> {
        return this._assetService.createAsset(payload);
    }
}
