import { MessageEntity } from '@social-chat/domain';

export const MESSAGE_REPO_TOKEN = Symbol('MESSAGE_REPO_TOKEN');

/**
 * Repository contract for the Message aggregate.
 *
 * Per the Epic 6 ADR (decision #2), the future shard key is
 * `{ conversationId: "hashed" }`. Every read MUST therefore include
 * `conversationId` in its predicate to remain shard-targeted.
 * This is enforced at the contract level — there is no
 * `findById(messageId)` or `findBySenderId(senderId)` here by design.
 */
export interface IMessageRepository {
    insert(message: MessageEntity): Promise<void>;
}
