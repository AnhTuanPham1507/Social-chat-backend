import { MessageEntity } from '@social-chat/domain';

export const MESSAGE_REPO_TOKEN = Symbol('MESSAGE_REPO_TOKEN');

export interface MessageWithSenderModel {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentKeys: string[];
    serverTs: Date;
    sender: {
        id: string;
        displayName: string;
        avatarUrl?: string;
    } | null;
}

export interface CursorPaginatedResult<T> {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
}

/**
 * Repository contract for the Message aggregate.
 *
 * Per the Epic 6 ADR (decision #2), the future shard key is
 * `{ conversationId: "hashed" }`. Every read MUST therefore include
 * `conversationId` in its predicate to remain shard-targeted —
 * lookups without conversationId would scatter-gather across every
 * shard. This is the invariant the contract enforces: there is no
 * `findById(messageId)` taking only a messageId, and no
 * `findBySenderId(senderId)`. Methods that take both messageId AND
 * conversationId are fine (they hit a single shard).
 */
export interface IMessageRepository {
    insert(message: MessageEntity): Promise<void>;
    findById(
        conversationId: string,
        messageId: string,
    ): Promise<MessageEntity | null>;
    findPageWithSender(
        conversationId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<MessageWithSenderModel>>;
}
