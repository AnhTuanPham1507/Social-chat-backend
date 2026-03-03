import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { PostModel } from './post.model';
import { AssetModel } from './asset.model';

@Entity('post_attachments')
@Index('idx_post_attachments_post', ['postId'])
export class PostAttachmentModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    postId: string;

    @Column('uuid')
    assetId: string;

    @Column('integer', { default: 0 })
    order: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => PostModel, (p) => p.attachments)
    @JoinColumn({ name: 'post_id' })
    post: PostModel;

    @ManyToOne(() => AssetModel)
    @JoinColumn({ name: 'asset_id' })
    asset: AssetModel;
}
