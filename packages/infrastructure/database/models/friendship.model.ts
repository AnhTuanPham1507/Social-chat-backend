import { FRIENDSHIP_STATUS } from '@social-chat/domain';
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

@Entity('friendships')
@Index('idx_friendships_requester', ['requesterId'])
@Index('idx_friendships_addressee', ['addresseeId'])
@Index('idx_friendships_status', ['status'])
export class FriendshipModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    requesterId: string;

    @Column('uuid')
    addresseeId: string;

    @Column('enum', { enum: FRIENDSHIP_STATUS, default: FRIENDSHIP_STATUS.PENDING })
    status: FRIENDSHIP_STATUS;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'requester_id' })
    requester: UserModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'addressee_id' })
    addressee: UserModel;
}
