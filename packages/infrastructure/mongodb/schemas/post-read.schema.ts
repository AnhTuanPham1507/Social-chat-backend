import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostReadDocument = HydratedDocument<PostRead>;

@Schema({ collection: 'feed_posts', timestamps: true })
export class PostRead {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ type: String, required: true })
    authorId: string;

    @Prop({ type: String, default: null })
    content?: string;

    @Prop({ type: String, required: true })
    visibility: string;

    @Prop({ type: Boolean, default: false })
    isEdited: boolean;

    @Prop({ type: Date, default: null })
    editedAt?: Date;

    @Prop({ type: String, default: null })
    originalPostId?: string;

    @Prop({ type: [String], default: [] })
    attachmentKeys: string[];

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
    totalCommentsCount: number;

    @Prop({ type: Number, default: 0 })
    totalSharesCount: number;

    @Prop({ type: Date })
    postCreatedAt: Date;

    @Prop({ type: Date })
    postUpdatedAt: Date;

    @Prop({ type: Date, default: null })
    postDeletedAt?: Date;
}

export const PostReadSchema = SchemaFactory.createForClass(PostRead);

PostReadSchema.index({ authorId: 1, visibility: 1, postCreatedAt: -1 });
PostReadSchema.index({ visibility: 1, postCreatedAt: -1 });
