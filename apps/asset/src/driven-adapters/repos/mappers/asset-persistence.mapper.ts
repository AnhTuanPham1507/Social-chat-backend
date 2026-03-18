import { AssetEntity, ASSET_PURPOSE, ASSET_TYPE, MIME_TYPE, ASSET_STATUS } from '@social-chat/domain';
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
      purpose: entity.purpose,
      mimeType: entity.mimeType,
      status: entity.status,
      metadata: entity.metadata,
      createdBy: entity.createdBy,
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
      purpose: model.purpose as ASSET_PURPOSE,
      mimeType: model.mimeType as MIME_TYPE,
      status: model.status as ASSET_STATUS,
      metadata: model.metadata ?? null,
      createdBy: model.createdBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt || undefined,
    });
  }
}
