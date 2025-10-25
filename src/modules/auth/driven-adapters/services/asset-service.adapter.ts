import { AssetService } from '@modules/asset/application/asset.service';
import { CreateAssetPayloadDTO } from '@modules/asset/driving-adapters/dtos/asset.dto';
import { IAssetService } from '@modules/auth/application/contracts/asset-service.contract';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetServiceAdapter implements IAssetService {
    constructor(private readonly _assetService: AssetService) {}

    public async upload(payload: CreateAssetPayloadDTO): Promise<string> {
        const asset = await this._assetService.createAsset(payload);

        return asset.url.value;
    }
}
