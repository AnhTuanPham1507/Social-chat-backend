export const USER_CONVERSATIONS_CACHE_TOKEN = Symbol(
    'USER_CONVERSATIONS_CACHE_TOKEN',
);

/**
 * Read-side port for the per-user conversations cache. Used by the gateway
 * on socket connect to know which `conversation:{convId}` Redis channels to
 * subscribe to.
 *
 * Source of truth lives in the messaging service (PostgreSQL); the cache is
 * maintained in Redis by `ConversationMembershipListener` over there. The
 * gateway is a read-only consumer.
 */
export interface IUserConversationsCache {
    findConversationIds(userId: string): Promise<string[]>;
}
