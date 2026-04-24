import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserReadDocument = HydratedDocument<UserRead>;

@Schema({ collection: 'feed_users', timestamps: true })
export class UserRead {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ type: String, required: true })
    displayName: string;

    @Prop({ type: String, default: null })
    avatarUrl?: string;
}

export const UserReadSchema = SchemaFactory.createForClass(UserRead);
