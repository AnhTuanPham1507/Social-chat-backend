import { PARTICIPANT_ROLE } from '@social-chat/domain';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserModel } from './user.model';
import { ConversationModel } from './conversation.model';
import { MessageModel } from './message.model';

@Entity('conversation_participants')
@Index('idx_participants_conversation', ['conversationId'])
@Index('idx_participants_user', ['userId'])
@Index('idx_participants_unique', ['conversationId', 'userId'], { unique: true })
export class ConversationParticipantModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    conversationId: string;

    @Column('uuid')
    userId: string;

    @Column('enum', { enum: PARTICIPANT_ROLE, default: PARTICIPANT_ROLE.MEMBER })
    role: PARTICIPANT_ROLE;

    @Column('varchar', { length: 100, nullable: true })
    nickname?: string;

    @Column('boolean', { default: false })
    isMuted: boolean;

    @Column('timestamp', { nullable: true })
    mutedUntil?: Date;

    @Column('uuid', { nullable: true })
    lastReadMessageId?: string;

    @Column('timestamp', { nullable: true })
    lastReadAt?: Date;

    @Column('timestamp')
    joinedAt: Date;

    @Column('timestamp', { nullable: true })
    leftAt?: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => ConversationModel, (c) => c.participants)
    @JoinColumn({ name: 'conversation_id' })
    conversation: ConversationModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'user_id' })
    user: UserModel;

    @ManyToOne(() => MessageModel, { nullable: true })
    @JoinColumn({ name: 'last_read_message_id' })
    lastReadMessage?: MessageModel;
}
