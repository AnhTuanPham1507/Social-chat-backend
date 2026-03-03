import { AssetEntity, ASSET_TYPE, MIME_TYPE, ASSET_STATUS } from '@social-chat/domain';
import { AssetModel } from '@social-chat/infrastructure';

export class AssetPersistenceMapper {
  static fromEntityToModel(entity: AssetEntity): Partial<AssetModel> {
    return {
      id: entity.id,
      bucket: entity.bucket,
      key: entity.key,
      originalName: entity.originalName,
      size: entity.size,
      assetType: entity.assetType,
      mimeType: entity.mimeType,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  static fromModelToEntity(model: AssetModel): AssetEntity {
    return AssetEntity.reconstitute({
      id: model.id,
      bucket: model.bucket,
      key: model.key,
      originalName: model.originalName,
      size: Number(model.size), // bigint comes as string from postgres
      assetType: model.assetType as ASSET_TYPE,
      mimeType: model.mimeType as MIME_TYPE,
      status: model.status as ASSET_STATUS,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt || undefined,
    });
  }
}
