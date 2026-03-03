import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { MessageModel } from './message.model';
import { AssetModel } from './asset.model';

@Entity('message_attachments')
@Index('idx_message_attachments_message', ['messageId'])
export class MessageAttachmentModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    messageId: string;

    @Column('uuid')
    assetId: string;

    @Column('integer', { default: 0 })
    order: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => MessageModel, (m) => m.attachments)
    @JoinColumn({ name: 'message_id' })
    message: MessageModel;

    @ManyToOne(() => AssetModel)
    @JoinColumn({ name: 'asset_id' })
    asset: AssetModel;
}
