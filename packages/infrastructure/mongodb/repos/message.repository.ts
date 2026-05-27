import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';

import { Message, MessageDocument } from '../schemas/message.schema';
import { BaseMongoRepository } from './base-mongo-repository';

export interface MessagePageRow {
    _id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentKeys: string[];
    serverTs: Date;
    sender?: {
        _id: string;
        displayName: string;
        avatarUrl?: string;
    };
}

@Injectable()
export class MessageMongoRepository extends BaseMongoRepository<MessageDocument> {
    constructor(@InjectModel(Message.name) model: Model<MessageDocument>) {
        super(model);
    }

    /**
     * Cursor-paginated page of messages with sender profile joined in.
     *
     * Sort = newest-first (matches the index `{conversationId:1, serverTs:-1, _id:-1}`).
     * Cursor is the compound key (serverTs, _id) of the last message the client
     * already saw; we emit messages strictly OLDER than the cursor.
     *
     * Sharding caveat: `$lookup` runs on the primary store's shard for the
     * `messages` collection. When `{conversationId:'hashed'}` sharding is enabled,
     * the joined `messaging_users` collection must remain unsharded (replicated to
     * every shard) or co-located, otherwise the join scatters cross-shard.
     */
    async findPageWithSender(
        conversationId: string,
        limit: number,
        cursor?: { serverTs: Date; messageId: string },
    ): Promise<MessagePageRow[]> {
        const match: Record<string, any> = { conversationId };
        if (cursor) {
            match.$or = [
                { serverTs: { $lt: cursor.serverTs } },
                { serverTs: cursor.serverTs, _id: { $lt: cursor.messageId } },
            ];
        }

        const pipeline: PipelineStage[] = [
            { $match: match },
            { $sort: { serverTs: -1, _id: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'messaging_users',
                    localField: 'senderId',
                    foreignField: '_id',
                    as: 'sender',
                },
            },
            {
                $unwind: {
                    path: '$sender',
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];

        return this.model.aggregate<MessagePageRow>(pipeline).exec();
    }
}
