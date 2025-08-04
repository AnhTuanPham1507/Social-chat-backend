import { AssetEntity } from '@modules/asset/domain/entities/asset/asset.entity';

export const ASSET_REPO_TOKEN = Symbol('ASSET_REPO_TOKEN');

export interface IAssetRepository {
    insert(asset: AssetEntity): Promise<void>;
}
