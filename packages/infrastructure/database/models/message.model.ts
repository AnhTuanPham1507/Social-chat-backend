import { BaseModel } from './base.model';
import { MESSAGE_TYPE, MESSAGE_STATUS } from '@social-chat/domain';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { UserModel } from './user.model';
import { ConversationModel } from './conversation.model';
import { MessageAttachmentModel } from './message-attachment.model';
import { MessageReactionModel } from './message-reaction.model';
import { MessageReadReceiptModel } from './message-read-receipt.model';

@Entity('messages')
@Index('idx_messages_conversation', ['conversationId'])
@Index('idx_messages_sender', ['senderId'])
@Index('idx_messages_created_at', ['conversationId', 'createdAt'])
@Index('idx_messages_reply_to', ['replyToId'])
export class MessageModel extends BaseModel {
    @Column('uuid')
    conversationId: string;

    @Column('uuid')
    senderId: string;

    @Column('enum', { enum: MESSAGE_TYPE, default: MESSAGE_TYPE.TEXT })
    type: MESSAGE_TYPE;

    @Column('text', { nullable: true })
    content?: string;

    @Column('enum', { enum: MESSAGE_STATUS, default: MESSAGE_STATUS.SENT })
    status: MESSAGE_STATUS;

    @Column('uuid', { nullable: true })
    replyToId?: string;

    @Column('uuid', { nullable: true })
    forwardedFromId?: string;

    @Column('boolean', { default: false })
    isEdited: boolean;

    @Column('timestamp', { nullable: true })
    editedAt?: Date;

    @Column('jsonb', { nullable: true })
    metadata?: Record<string, any>;

    @ManyToOne(() => ConversationModel, (c) => c.messages)
    @JoinColumn({ name: 'conversation_id' })
    conversation: ConversationModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'sender_id' })
    sender: UserModel;

    @ManyToOne(() => MessageModel, { nullable: true })
    @JoinColumn({ name: 'reply_to_id' })
    replyTo?: MessageModel;

    @ManyToOne(() => MessageModel, { nullable: true })
    @JoinColumn({ name: 'forwarded_from_id' })
    forwardedFrom?: MessageModel;

    @OneToMany(() => MessageAttachmentModel, (a) => a.message)
    attachments: MessageAttachmentModel[];

    @OneToMany(() => MessageReactionModel, (r) => r.message)
    reactions: MessageReactionModel[];

    @OneToMany(() => MessageReadReceiptModel, (r) => r.message)
    readReceipts: MessageReadReceiptModel[];
}
