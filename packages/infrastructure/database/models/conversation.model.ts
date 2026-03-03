import { BaseModel } from './base.model';
import { CONVERSATION_TYPE } from '@social-chat/domain';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { UserModel } from './user.model';
import { MessageModel } from './message.model';
import { ConversationParticipantModel } from './conversation-participant.model';

@Entity('conversations')
@Index('idx_conversations_type', ['type'])
@Index('idx_conversations_last_message_at', ['lastMessageAt'])
@Index('idx_conversations_created_by', ['createdById'])
export class ConversationModel extends BaseModel {
    @Column('enum', { enum: CONVERSATION_TYPE })
    type: CONVERSATION_TYPE;

    @Column('varchar', { length: 255, nullable: true })
    name?: string;

    @Column('text', { nullable: true })
    description?: string;

    @Column('text', { nullable: true })
    avatarUrl?: string;

    @Column('uuid', { nullable: true })
    lastMessageId?: string;

    @Column('timestamp', { nullable: true })
    lastMessageAt?: Date;

    @Column('uuid')
    createdById: string;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'created_by_id' })
    createdBy: UserModel;

    @OneToOne(() => MessageModel, { nullable: true })
    @JoinColumn({ name: 'last_message_id' })
    lastMessage?: MessageModel;

    @OneToMany(() => ConversationParticipantModel, (p) => p.conversation)
    participants: ConversationParticipantModel[];

    @OneToMany(() => MessageModel, (m) => m.conversation)
    messages: MessageModel[];
}
