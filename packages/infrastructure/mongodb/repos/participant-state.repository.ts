import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    ParticipantState,
    ParticipantStateDocument,
} from '../schemas/participant-state.schema';
import { BaseMongoRepository } from './base-mongo-repository';

export interface ParticipantStateRow {
    conversationId: string;
    userId: string;
    lastReadMessageId: string | null;
    lastReadAt: Date | null;
}

@Injectable()
export class ParticipantStateMongoRepository extends BaseMongoRepository<ParticipantStateDocument> {
    constructor(
        @InjectModel(ParticipantState.name) model: Model<ParticipantStateDocument>,
    ) {
        super(model);
    }

    /**
     * Atomic forward-only watermark upsert.
     *
     * `$max` ensures the watermark only advances. UUIDv7 is lexicographically
     * time-ordered, so string `$max` == chronological max. Same applied to
     * `lastReadAt` (server-monotonic in normal operation).
     *
     * `returnDocument: 'before'` gives the PREV row in the same round-trip —
     * the orchestrator needs it to compute the `(prev, current]` range for
     * downstream distinct-senders fan-out.
     *
     * Stale acks (multi-device reconnect race, retried network call) get
     * silently absorbed: `$max` degenerates to a no-op. Caller infers
     * "no advance" by comparing `prev.lastReadMessageId` to incoming.
     *
     * Upsert + `$setOnInsert` covers the first ack for a (conv, user) pair
     * without a separate insert path.
     */
    async advanceReadWatermark(
        conversationId: string,
        userId: string,
        messageId: string,
        readAt: Date,
    ): Promise<ParticipantStateRow | null> {
        const before = await this.model
            .findOneAndUpdate(
                { conversationId, userId },
                {
                    $max: { lastReadMessageId: messageId, lastReadAt: readAt },
                    $setOnInsert: { conversationId, userId },
                },
                {
                    upsert: true,
                    returnDocument: 'before',
                    lean: true,
                },
            )
            .exec();

        if (!before) return null;
        return {
            conversationId: before.conversationId,
            userId: before.userId,
            lastReadMessageId: before.lastReadMessageId ?? null,
            lastReadAt: before.lastReadAt ?? null,
        };
    }

    async findByConversation(
        conversationId: string,
    ): Promise<ParticipantStateRow[]> {
        const rows = await this.model
            .find({ conversationId })
            .lean()
            .exec();
        return rows.map((r) => ({
            conversationId: r.conversationId,
            userId: r.userId,
            lastReadMessageId: r.lastReadMessageId ?? null,
            lastReadAt: r.lastReadAt ?? null,
        }));
    }
}
