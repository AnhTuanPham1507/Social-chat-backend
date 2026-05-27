import { ConversationEntity } from '@social-chat/domain';

export const CONVERSATION_REPO_TOKEN = Symbol('CONVERSATION_REPO_TOKEN');

/**
 * Opaque cursor for inbox pagination. Encodes the (lastActivityAt, id) of
 * the last row of the previous page so the next query can resume strictly
 * after it. Repo is responsible for encoding/decoding.
 */
export interface FindByMemberOptions {
    cursor?: string;
    limit?: number;
}

export interface FindByMemberResult {
    items: ConversationEntity[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface IConversationRepository {
    insert(conversation: ConversationEntity): Promise<void>;
    findById(id: string): Promise<ConversationEntity | null>;
    findExistingDM(userIdA: string, userIdB: string): Promise<ConversationEntity | null>;
    /**
     * Inbox query: conversations the given user is a member of, ordered by
     * (lastActivityAt DESC, id DESC). Page size is bounded.
     */
    findByMemberId(userId: string, opts: FindByMemberOptions): Promise<FindByMemberResult>;
    /**
     * Direct UPDATE bump. No-op if `at` is not strictly newer than the
     * current `lastActivityAt`, so out-of-order arrivals don't roll the
     * activity backwards.
     */
    bumpLastActivityAt(conversationId: string, at: Date): Promise<void>;
}
