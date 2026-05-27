import { Injectable } from '@nestjs/common';

import { MessageEntity } from '@social-chat/domain';
import { MessageMongoRepository } from '@social-chat/infrastructure';

import {
    CursorPaginatedResult,
    IMessageRepository,
    MessageWithSenderModel,
} from '@application/contracts/message-repository.contract';
import { MessagePersistenceMapper } from './mappers/message-persistence.mapper';

interface DecodedCursor {
    serverTs: Date;
    messageId: string;
}

function encodeCursor(serverTs: Date, messageId: string): string {
    const payload = JSON.stringify({ s: serverTs.toISOString(), i: messageId });
    return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): DecodedCursor | null {
    try {
        const json = Buffer.from(cursor, 'base64url').toString('utf8');
        const parsed = JSON.parse(json) as { s: string; i: string };
        const serverTs = new Date(parsed.s);
        if (Number.isNaN(serverTs.getTime()) || !parsed.i) return null;
        return { serverTs, messageId: parsed.i };
    } catch {
        return null;
    }
}

@Injectable()
export class MessageRepo implements IMessageRepository {
    constructor(private readonly _repo: MessageMongoRepository) {}

    public async insert(message: MessageEntity): Promise<void> {
        const doc = MessagePersistenceMapper.fromEntityToDoc(message);
        await this._repo.insert(doc);
    }

    public async findById(
        conversationId: string,
        messageId: string,
    ): Promise<MessageEntity | null> {
        const doc = await this._repo.findOne({
            _id: messageId,
            conversationId,
        });
        return doc ? MessagePersistenceMapper.fromDocToEntity(doc) : null;
    }

    public async findPageWithSender(
        conversationId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<MessageWithSenderModel>> {
        const decoded = cursor ? decodeCursor(cursor) : undefined;

        const rows = await this._repo.findPageWithSender(
            conversationId,
            limit + 1,
            decoded ?? undefined,
        );

        const hasMore = rows.length > limit;
        if (hasMore) rows.pop();

        const items: MessageWithSenderModel[] = rows.map((r) => ({
            id: r._id,
            conversationId: r.conversationId,
            senderId: r.senderId,
            content: r.content,
            attachmentKeys: r.attachmentKeys ?? [],
            serverTs: r.serverTs,
            sender: r.sender
                ? {
                      id: r.sender._id,
                      displayName: r.sender.displayName,
                      avatarUrl: r.sender.avatarUrl,
                  }
                : null,
        }));

        const last = items[items.length - 1];
        const nextCursor =
            hasMore && last ? encodeCursor(last.serverTs, last.id) : null;

        return { items, nextCursor, hasMore };
    }
}
