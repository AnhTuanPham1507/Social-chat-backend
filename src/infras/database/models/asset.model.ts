import {
    Entity,
    Column,
} from 'typeorm';
import { BaseModel } from './base.model';
import { AssetType } from '../../../core/enums/asset-type.enum';
import { MimeType } from '../../../core/enums/mime-type.enum';

@Entity('asset')
export class AssetModel extends BaseModel {
    @Column()
    name: string;

    @Column()
    url: string;

    @Column({ nullable: true })
    size: number | null;

    @Column({
        type: 'enum',
        enum: MimeType,
    })
    mimetype: MimeType;

    @Column({
        type: 'enum',
        enum: AssetType,
    })
    assetType: AssetType;

    @Column({ nullable: true })
    ownerId: string | null;

    @Column('json', { nullable: true })
    metadata: object | null;
}
