import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Unique,
} from 'typeorm';
import { MessageModel } from './message.model';
import { UserModel } from './user.model';

@Entity('message_read_receipts')
@Index('idx_read_receipts_message', ['messageId'])
@Index('idx_read_receipts_user', ['userId'])
@Unique('idx_read_receipts_unique', ['messageId', 'userId'])
export class MessageReadReceiptModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    messageId: string;

    @Column('uuid')
    userId: string;

    @Column('timestamp')
    readAt: Date;

    @ManyToOne(() => MessageModel, (m) => m.readReceipts)
    @JoinColumn({ name: 'message_id' })
    message: MessageModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'user_id' })
    user: UserModel;
}
