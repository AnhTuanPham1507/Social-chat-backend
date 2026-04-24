import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentReadDocument = HydratedDocument<CommentRead>;

@Schema({ _id: false })
export class CommentAuthor {
    @Prop({ type: String, required: true })
    id: string;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, default: null })
    avatar?: string;
}

@Schema({ collection: 'feed_comments', timestamps: true })
export class CommentRead {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ type: String, required: true })
    postId: string;

    @Prop({ type: String, default: null })
    parentCommentId?: string;

    @Prop({ type: CommentAuthor, required: true })
    author: CommentAuthor;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    attachments: string[];

    @Prop({ type: Boolean, default: false })
    isEdited: boolean;

    @Prop({ type: Date, default: null })
    editedAt?: Date;

    @Prop({
        type: Object,
        default: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    })
    reactionCounts: {
        like: number;
        love: number;
        haha: number;
        wow: number;
        sad: number;
        angry: number;
    };

    @Prop({ type: Number, default: 0 })
    repliesCount: number;

    @Prop({ type: Date })
    commentCreatedAt: Date;

    @Prop({ type: Date })
    commentUpdatedAt: Date;

    @Prop({ type: Date, default: null })
    commentDeletedAt?: Date;
}

export const CommentReadSchema = SchemaFactory.createForClass(CommentRead);

CommentReadSchema.index({ postId: 1, commentCreatedAt: -1 });
CommentReadSchema.index({ parentCommentId: 1, commentCreatedAt: -1 });
