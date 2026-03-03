import { NOTIFICATION_TYPE } from '@social-chat/domain';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { UserModel } from './user.model';

@Entity('notifications')
@Index('idx_notifications_user', ['userId'])
@Index('idx_notifications_unread', ['userId', 'isRead'])
@Index('idx_notifications_created_at', ['userId', 'createdAt'])
export class NotificationModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    userId: string;

    @Column('enum', { enum: NOTIFICATION_TYPE })
    type: NOTIFICATION_TYPE;

    @Column('varchar', { length: 255 })
    title: string;

    @Column('text', { nullable: true })
    content?: string;

    @Column('jsonb', { nullable: true })
    data?: Record<string, any>;

    @Column('boolean', { default: false })
    isRead: boolean;

    @Column('timestamp', { nullable: true })
    readAt?: Date;

    @Column('uuid', { nullable: true })
    actorId?: string;

    @Column('uuid', { nullable: true })
    referenceId?: string;

    @Column('varchar', { length: 50, nullable: true })
    referenceType?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'user_id' })
    user: UserModel;

    @ManyToOne(() => UserModel, { nullable: true })
    @JoinColumn({ name: 'actor_id' })
    actor?: UserModel;
}
