import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParticipantStateDocument = HydratedDocument<ParticipantState>;

/**
 * Per-(conversation, user) read watermark. One row per member per conversation.
 * In a 1024-member group, that's 1024 rows for the whole group — the optimal
 * floor (each member needs their own state; no further compression possible
 * without losing per-user resolution).
 *
 * Index: compound unique on (conversationId, userId). Prefix-covers both
 * "find one by (conv, user)" AND "find all by conversation" — two query
 * patterns, one index.
 */
@Schema({ collection: 'participant_state', timestamps: true })
export class ParticipantState {
    @Prop({ type: String, required: true })
    conversationId: string;

    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: String, default: null })
    lastReadMessageId: string | null;

    @Prop({ type: Date, default: null })
    lastReadAt: Date | null;
}

export const ParticipantStateSchema = SchemaFactory.createForClass(ParticipantState);

ParticipantStateSchema.index(
    { conversationId: 1, userId: 1 },
    { unique: true },
);
