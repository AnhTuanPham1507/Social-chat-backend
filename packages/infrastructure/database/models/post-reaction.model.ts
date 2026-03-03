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
import { PostModel } from './post.model';
import { UserModel } from './user.model';

@Entity('post_reactions')
@Index('idx_post_reactions_post', ['postId'])
@Unique('idx_post_reactions_unique', ['postId', 'userId'])
export class PostReactionModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    postId: string;

    @Column('uuid')
    userId: string;

    @Column('enum', { enum: REACTION_TYPE })
    reaction: REACTION_TYPE;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => PostModel, (p) => p.reactions)
    @JoinColumn({ name: 'post_id' })
    post: PostModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'user_id' })
    user: UserModel;
}
