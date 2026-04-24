import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReactionReadDocument = HydratedDocument<ReactionRead>;

@Schema({ _id: false })
export class ReactionAuthor {
    @Prop({ type: String, required: true })
    id: string;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, default: null })
    avatar?: string;
}

@Schema({ collection: 'feed_reactions', timestamps: true })
export class ReactionRead {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ type: String, required: true })
    contentId: string;

    @Prop({ type: String, required: true, enum: ['POST', 'COMMENT'] })
    contentType: string;

    @Prop({ type: String, required: true })
    reaction: string;

    @Prop({ type: ReactionAuthor, required: true })
    author: ReactionAuthor;

    @Prop({ type: Date })
    reactionCreatedAt: Date;
}

export const ReactionReadSchema = SchemaFactory.createForClass(ReactionRead);

ReactionReadSchema.index({ contentId: 1, contentType: 1, reactionCreatedAt: -1 });
ReactionReadSchema.index({ 'author.id': 1 });
