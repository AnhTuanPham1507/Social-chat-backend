import { CreatedAt, DeletedAt, UpdatedAt, UUID } from '@beincom/domain';
import { IBaseMapper } from '@common/core/base-mapper.interface';
import { Url } from '@common/core/value-objects/url.value-object';
import { AssetModel } from '@infras/database/models/asset.model';
import {
    AssetEntity,
    ICreateAssetProps,
} from '@modules/asset/domain/entities/asset/asset.entity';
import { Injectable } from '@nestjs/common';

import { AssetSize } from '../domain/entities/asset/asset-size.value-object';
import { AssetType } from '../domain/entities/asset/asset-type.value-object';
import { MimeType } from '../domain/entities/asset/mime-type.value-object';

export const ASSET_MAPPER_TOKEN = 'ASSET_MAPPER_TOKEN';

export interface IAssetMapper
    extends IBaseMapper<AssetEntity, AssetModel, Partial<ICreateAssetProps>> {}

@Injectable()
export class AssetMapper implements IAssetMapper {
    public fromEntityToModel(entity: AssetEntity): Partial<AssetModel> {
        const model: Partial<AssetModel> = {
            id: entity.id.value,
            name: entity.name,
            url: entity.url.value,
            size: entity.size.value,
            assetType: entity.assetType.value,
            mimeType: entity.mimeType.value,
            createdAt: entity.createdAt.value,
            updatedAt: entity.updatedAt.value,
            deletedAt: entity.deletedAt.value,
        };

        return model;
    }

    public fromPropsToEntity(props: ICreateAssetProps): AssetEntity {
        return new AssetEntity({
            id: props.id ? new UUID(props.id) : UUID.generate(),
            props: {
                name: props.name,
                assetType: AssetType.fromString(props.assetType),
                mimeType: MimeType.fromString(props.mimeType),
                url: Url.fromString(props.url),
                size: AssetSize.fromNumber(props.size),
            },
            createdAt: CreatedAt.fromDateString(
                props.createdAt
                    ? props.createdAt.toISOString()
                    : new Date().toISOString(),
            ),
            updatedAt: UpdatedAt.fromDateString(
                props.updatedAt
                    ? props.updatedAt.toISOString()
                    : new Date().toISOString(),
            ),
            deletedAt: props.deletedAt
                ? DeletedAt.fromDateString(props.deletedAt.toISOString())
                : null,
        });
    }
}
