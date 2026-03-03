import { BaseModel } from './base.model';
import { POST_VISIBILITY } from '@social-chat/domain';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { UserModel } from './user.model';
import { PostAttachmentModel } from './post-attachment.model';
import { PostReactionModel } from './post-reaction.model';
import { PostCommentModel } from './post-comment.model';

@Entity('posts')
@Index('idx_posts_author', ['authorId'])
@Index('idx_posts_visibility', ['visibility'])
@Index('idx_posts_created_at', ['createdAt'])
@Index('idx_posts_feed', ['authorId', 'visibility', 'createdAt'])
export class PostModel extends BaseModel {
    @Column('uuid')
    authorId: string;

    @Column('text', { nullable: true })
    content?: string;

    @Column('enum', { enum: POST_VISIBILITY, default: POST_VISIBILITY.PUBLIC })
    visibility: POST_VISIBILITY;

    @Column('integer', { default: 0 })
    reactionsCount: number;

    @Column('integer', { default: 0 })
    commentsCount: number;

    @Column('integer', { default: 0 })
    sharesCount: number;

    @Column('boolean', { default: false })
    isEdited: boolean;

    @Column('timestamp', { nullable: true })
    editedAt?: Date;

    @Column('uuid', { nullable: true })
    originalPostId?: string;

    @ManyToOne(() => UserModel)
    @JoinColumn({ name: 'author_id' })
    author: UserModel;

    @ManyToOne(() => PostModel, { nullable: true })
    @JoinColumn({ name: 'original_post_id' })
    originalPost?: PostModel;

    @OneToMany(() => PostAttachmentModel, (a) => a.post)
    attachments: PostAttachmentModel[];

    @OneToMany(() => PostReactionModel, (r) => r.post)
    reactions: PostReactionModel[];

    @OneToMany(() => PostCommentModel, (c) => c.post)
    comments: PostCommentModel[];
}
