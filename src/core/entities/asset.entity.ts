import { AssetType } from '../enums/asset-type.enum';
import { MimeType } from '../enums/mime-type.enum';
import { Entity } from '../interfaces/base-entity.interface';

export interface IAssetProps {
    name?: string;
    path?: string;
    size?: number;
    ownerId?: string;
    mimetype?: MimeType;
    assetType?: AssetType;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class AssetEntity extends Entity {
    name?: string;
    path?: string;
    size?: number;
    ownerId?: string;
    mimetype?: MimeType;
    assetType?: AssetType;
    metadata?: any;

    constructor(id?: string, props?: IAssetProps) {
        super(id);

        if (props) {
            this.name = props.name;
            this.path = props.path;
            this.size = props.size;
            this.ownerId = props.ownerId;
            this.mimetype = props.mimetype;
            this.assetType = props.assetType;
            this.metadata = props.metadata;
            this.createdAt = props.createdAt;
            this.updatedAt = props.updatedAt;
            this.deletedAt = props.deletedAt;
        }
    }
}
