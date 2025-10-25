import { Entity, EntityProps, UUID } from '@beincom/domain';
import { Url } from '@common/core/value-objects/url.value-object';
import {
    MIME_TYPE,
    MimeType,
} from '@modules/asset/domain/entities/asset/mime-type.value-object';

import { AssetSize } from './asset-size.value-object';
import { ASSET_TYPE, AssetType } from './asset-type.value-object';

export interface IAssetProps {
    name: string;
    url: Url;
    size: AssetSize;
    assetType: AssetType;
    mimeType: MimeType;
}

export interface ICreateAssetProps {
    id: UUID;
    name: string;
    url: string;
    size: number;
    assetType: ASSET_TYPE;
    mimeType: MIME_TYPE;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

export class AssetEntity extends Entity<UUID, IAssetProps> {
    protected _id: UUID;

    public validate(): void | never {
        // throw new Error('Method not implemented.');
    }

    constructor(props: EntityProps<UUID, IAssetProps>) {
        super(props);
    }

    public get url(): Url {
        return this._props.url;
    }

    public get name(): string {
        return this._props.name;
    }

    public get size(): AssetSize {
        return this._props.size;
    }

    public get assetType(): AssetType {
        return this._props.assetType;
    }

    public get mimeType(): MimeType {
        return this._props.mimeType;
    }
}
