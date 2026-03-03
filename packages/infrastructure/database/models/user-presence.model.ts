import { PRESENCE_STATUS } from '@social-chat/domain';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserModel } from './user.model';

@Entity('user_presences')
@Index('idx_presences_user', ['userId'], { unique: true })
@Index('idx_presences_status', ['status'])
export class UserPresenceModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid', { unique: true })
    userId: string;

    @Column('enum', { enum: PRESENCE_STATUS, default: PRESENCE_STATUS.OFFLINE })
    status: PRESENCE_STATUS;

    @Column('varchar', { length: 100, nullable: true })
    customStatus?: string;

    @Column('timestamp')
    lastSeenAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @OneToOne(() => UserModel)
    @JoinColumn({ name: 'user_id' })
    user: UserModel;
}
