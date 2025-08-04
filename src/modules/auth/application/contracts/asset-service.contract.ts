import { AssetEntity } from '@modules/asset/domain/entities/asset/asset.entity';
import { CreateAssetPayloadDTO } from '@modules/asset/driving-adapters/dtos/create-asset-payload.dto';

export const ASSET_SERVICE_TOKEN = Symbol('ASSET_SERVICE_TOKEN');

export interface IAssetService {
    createAsset(payload: CreateAssetPayloadDTO): Promise<AssetEntity>;
}
