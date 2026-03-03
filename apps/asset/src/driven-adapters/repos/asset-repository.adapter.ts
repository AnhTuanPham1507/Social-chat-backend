import { Injectable } from '@nestjs/common';
import { AssetEntity } from '@social-chat/domain';
import { BaseAssetRepository } from '@social-chat/infrastructure';
import { IAssetRepository } from '@application/contracts/asset-repository.contract';
import { AssetPersistenceMapper } from './mappers/asset-persistence.mapper';

@Injectable()
export class AssetRepo implements IAssetRepository {
  constructor(private readonly _assetRepo: BaseAssetRepository) {}

  async insert(asset: AssetEntity): Promise<void> {
    const model = AssetPersistenceMapper.fromEntityToModel(asset);
    await this._assetRepo.create(model);
  }

  async findById(id: string): Promise<AssetEntity | null> {
    const model = await this._assetRepo.findOne({ id });
    return model ? AssetPersistenceMapper.fromModelToEntity(model) : null;
  }

  async update(asset: AssetEntity): Promise<void> {
    const model = AssetPersistenceMapper.fromEntityToModel(asset);
    await this._assetRepo.update(asset.id, model);
  }

  async delete(id: string): Promise<void> {
    await this._assetRepo.delete(id);
  }
}
