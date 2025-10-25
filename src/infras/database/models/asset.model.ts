import { BaseModel } from '@infras/database/models/base.model';
import { ASSET_TYPE } from '@modules/asset/domain/entities/asset/asset-type.value-object';
import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';
import { Column, Entity } from 'typeorm';

@Entity('assets')
export class AssetModel extends BaseModel {
    @Column('varchar', { length: 255 })
    name: string;

    @Column('text')
    url: string;

    @Column('bigint')
    size: number;

    @Column('enum', { enum: ASSET_TYPE })
    assetType: ASSET_TYPE;

    @Column('enum', { enum: MIME_TYPE })
    mimeType: MIME_TYPE;

    @Column('jsonb', { nullable: true })
    metadata: any;
}
