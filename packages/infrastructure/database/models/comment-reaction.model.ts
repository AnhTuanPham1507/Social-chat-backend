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
import { PostCommentModel } from './post-comment.model';
import { UserModel } from './user.model';

@Entity('comment_reactions')
@Index('idx_comment_reactions_comment', ['commentId'])
@Unique('idx_comment_reactions_unique', ['commentId', 'userId'])
export class CommentReactionModel {
    @PrimaryColumn()
    id: string;

    @Column('uuid')
    commentId: string;

    @Column('uuid')
    userId: string;

    @Column('enum', { enum: REACTION_TYPE })
    reaction: REACTION_TYPE;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @ManyToOne(() => PostCommentModel, (c) => c.reactions)
    @JoinColumn({ name: 'comment_id' })
    comment: PostCommentModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'user_id' })
    user: UserModel;
}
