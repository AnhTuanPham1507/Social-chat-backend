import { REACTION_TYPE } from '@social-chat/domain';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    Unique,
} from 'typeorm';
import { MessageModel } from './message.model';
import { UserModel } from './user.model';

@Entity('message_reactions')
@Index('idx_reactions_message', ['messageId'])
@Unique('idx_reactions_unique', ['messageId', 'userId', 'reaction'])
export class MessageReactionModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    messageId: string;

    @Column('uuid')
    userId: string;

    @Column('enum', { enum: REACTION_TYPE })
    reaction: REACTION_TYPE;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => MessageModel, (m) => m.reactions)
    @JoinColumn({ name: 'message_id' })
    message: MessageModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'user_id' })
    user: UserModel;
}
