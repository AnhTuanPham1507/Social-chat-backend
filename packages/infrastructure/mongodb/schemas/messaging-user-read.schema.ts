import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessagingUserReadDocument = HydratedDocument<MessagingUserRead>;

@Schema({ collection: 'messaging_users', timestamps: true })
export class MessagingUserRead {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ type: String, required: true })
    displayName: string;

    @Prop({ type: String, default: null })
    avatarUrl?: string;
}

export const MessagingUserReadSchema = SchemaFactory.createForClass(MessagingUserRead);
