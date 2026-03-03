import { AssetEntity } from '@social-chat/domain';

export const ASSET_REPO_TOKEN = Symbol('ASSET_REPO_TOKEN');

export interface IAssetRepository {
  insert(asset: AssetEntity): Promise<void>;
  findById(id: string): Promise<AssetEntity | null>;
  update(asset: AssetEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
