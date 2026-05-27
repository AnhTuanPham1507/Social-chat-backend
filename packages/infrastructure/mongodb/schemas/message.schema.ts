import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

/**
 * Mongo document for a single message.
 *
 * `_id` is a UUIDv7 string supplied by the domain layer — Mongo does not
 * generate it. We disable the implicit Mongoose `_id` autogen by typing
 * `_id` as `String` and providing it ourselves.
 *
 * `timestamps: false` because we collapse `createdAt`/`updatedAt` onto
 * `serverTs` per the Epic 6 ADR; Mongoose's auto-timestamps would
 * duplicate the field with a different name.
 *
 * Indexes (declared at file bottom):
 *   - Primary key  `_id` (auto)
 *   - Pagination   `{ conversationId: 1, serverTs: -1, _id: -1 }`
 *
 * Future shard key (designed, not enabled): `{ conversationId: "hashed" }`.
 * Every primary-store query MUST include `conversationId` in its predicate
 * to remain shard-targeted once sharding is turned on.
 */
@Schema({ collection: 'messages', timestamps: false })
export class Message {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ type: String, required: true })
    conversationId: string;

    @Prop({ type: String, required: true })
    senderId: string;

    /**
     * Empty string is valid at the storage layer — the composition invariant
     * "content OR ≥1 attachment" is enforced by `MessageEntity` in the
     * domain layer. Mongoose `required: true` rejects empty strings, which
     * would force the schema to duplicate (and partially mis-enforce) the
     * domain invariant. Default `''` keeps the column non-null.
     */
    @Prop({ type: String, required: false, default: '' })
    content: string;

    /**
     * Opaque R2 object keys for attached assets, owned by the asset
     * bounded context. Stored as a flat string array so the messaging
     * service stays decoupled from variant generation and type detection.
     * Empty array when the message is text-only.
     */
    @Prop({ type: [String], required: true, default: [] })
    attachmentKeys: string[];

    @Prop({ type: Date, required: true })
    serverTs: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Pagination index — Equality (conversationId), Sort+Range (serverTs), Tiebreaker (_id).
// Field order and directions are load-bearing for cursor pagination performance —
// see _bmad-output/architecture-epic-6-messaging.md decision #2.
MessageSchema.index({ conversationId: 1, serverTs: -1, _id: -1 });
