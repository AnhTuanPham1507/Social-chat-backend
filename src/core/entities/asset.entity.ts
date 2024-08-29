import { AssetType } from '../enums/asset-type.enum';
import { MimeType } from '../enums/mime-type.enum';
import { Entity } from '../interfaces/base-entity.interface';

export interface IAssetProps {
    name?: string;
    url?: string;
    size?: number;
    ownerId?: string;
    mimeType?: MimeType;
    assetType?: AssetType;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class AssetEntity extends Entity {
    name?: string;
    url?: string;
    size?: number;
    ownerId?: string;
    mimeType?: MimeType;
    assetType?: AssetType;
    metadata?: any;

    private constructor(id?: string, props?: IAssetProps) {
        super(id);

        if (props) {
            this.name = props.name;
            this.url = props.url;
            this.size = props.size;
            this.ownerId = props.ownerId;
            this.mimeType = props.mimeType;
            this.assetType = props.assetType;
            this.metadata = props.metadata;
            this.createdAt = props.createdAt;
            this.updatedAt = props.updatedAt;
            this.deletedAt = props.deletedAt;
        }
    }
}
