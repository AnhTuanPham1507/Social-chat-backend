import { CreateAssetPayloadDTO } from '@modules/asset/driving-adapters/dtos/asset.dto';

export const ASSET_SERVICE_TOKEN = Symbol('ASSET_SERVICE_TOKEN');

export interface IAssetService {
    upload(payload: CreateAssetPayloadDTO): Promise<string>;
}
