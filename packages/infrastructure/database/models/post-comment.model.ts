import { BaseModel } from './base.model';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { PostModel } from './post.model';
import { UserModel } from './user.model';
import { CommentReactionModel } from './comment-reaction.model';

@Entity('post_comments')
@Index('idx_post_comments_post', ['postId'])
@Index('idx_post_comments_author', ['authorId'])
@Index('idx_post_comments_parent', ['parentCommentId'])
@Index('idx_post_comments_created_at', ['postId', 'createdAt'])
export class PostCommentModel extends BaseModel {
    @Column('uuid')
    postId: string;

    @Column('uuid')
    authorId: string;

    @Column('uuid', { nullable: true })
    parentCommentId?: string;

    @Column('text')
    content: string;

    @Column('integer', { default: 0 })
    reactionsCount: number;

    @Column('integer', { default: 0 })
    repliesCount: number;

    @Column('boolean', { default: false })
    isEdited: boolean;

    @Column('timestamp', { nullable: true })
    editedAt?: Date;

    @ManyToOne(() => PostModel, (p) => p.comments)
    @JoinColumn({ name: 'post_id' })
    post: PostModel;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'author_id' })
    author: UserModel;

    @ManyToOne(() => PostCommentModel, { nullable: true })
    @JoinColumn({ name: 'parent_comment_id' })
    parentComment?: PostCommentModel;

    @OneToMany(() => PostCommentModel, (c) => c.parentComment)
    replies: PostCommentModel[];

    @OneToMany(() => CommentReactionModel, (r) => r.comment)
    reactions: CommentReactionModel[];
}
