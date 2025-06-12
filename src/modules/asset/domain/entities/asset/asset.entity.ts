import {
    CreatedAt,
    DeletedAt,
    Entity,
    EntityProps,
    UpdatedAt,
    UUID,
} from '@beincom/domain';
import { URL } from '@commons/core/value-objects/url.value-object';
import {
    MIME_TYPE,
    MimeType,
} from '@modules/asset/domain/entities/asset/mime-type.value-object';

import { AssetSize } from './asset-size.value-object';
import { ASSET_TYPE, AssetType } from './asset-type.value-object';

export interface IAssetProps {
    name?: string;
    url?: URL;
    size?: AssetSize;
    assetType?: AssetType;
    mimeType?: MimeType;
    metadata?: any;
}

export interface ICreateAssetProps {
    id?: UUID;
    name?: string;
    url?: string;
    size?: number;
    metadata?: any;
    assetType?: ASSET_TYPE;
    mimeType?: MIME_TYPE;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class AssetEntity extends Entity<UUID, IAssetProps> {
    protected _id: UUID;

    validate(): void | never {
        // throw new Error('Method not implemented.');
    }

    constructor(props: EntityProps<UUID, IAssetProps>) {
        super(props);
    }

    public get url(): URL {
        return this._props.url;
    }

    public static create(props: ICreateAssetProps): AssetEntity {
        return new AssetEntity({
            id: props.id ? new UUID(props.id) : UUID.generate(),
            props: {
                ...props,
                assetType: AssetType.fromString(props.assetType),
                mimeType: MimeType.fromString(props.mimeType),
                size: AssetSize.fromNumber(props.size),
                url: new URL(props.url),
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

    static fromRaw(raw: any) {
        return new AssetEntity({
            id: new UUID(raw.id),
            props: {
                ...raw,
                assetType: AssetType.fromString(raw.assetType),
                mimeType: MimeType.fromString(raw.mimeType),
                size: AssetSize.fromNumber(raw.size),
                url: new URL(raw.url),
            },
            createdAt: CreatedAt.fromDateString(raw.createdAt),
            updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
            deletedAt: raw.deletedAt
                ? DeletedAt.fromDateString(raw.deletedAt)
                : null,
        });
    }
}
