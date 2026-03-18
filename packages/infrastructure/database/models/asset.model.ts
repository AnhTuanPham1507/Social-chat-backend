import { BaseModel } from './base.model';
import { ASSET_PURPOSE, ASSET_STATUS, ASSET_TYPE, MIME_TYPE } from '@social-chat/domain';
import { Column, Entity } from 'typeorm';

@Entity('assets')
export class AssetModel extends BaseModel {
    @Column('varchar', { length: 255 })
    bucket: string;

    @Column('varchar', { length: 512 })
    key: string;

    @Column('varchar', { length: 255 })
    originalName: string;

    @Column('bigint')
    size: number;

    @Column('enum', { enum: ASSET_TYPE })
    assetType: ASSET_TYPE;

    @Column('enum', { enum: ASSET_PURPOSE })
    purpose: ASSET_PURPOSE;

    @Column('enum', { enum: MIME_TYPE })
    mimeType: MIME_TYPE;

    @Column('enum', { enum: ASSET_STATUS, default: ASSET_STATUS.PENDING })
    status: ASSET_STATUS;

    @Column('jsonb', { nullable: true })
    metadata: Record<string, unknown> | null;

    @Column('varchar', { length: 255 })
    createdBy: string;
}
