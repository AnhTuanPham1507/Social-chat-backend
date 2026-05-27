export const PARTICIPANT_STATE_REPO_TOKEN = Symbol(
    'PARTICIPANT_STATE_REPO_TOKEN',
);

export interface ParticipantStateModel {
    conversationId: string;
    userId: string;
    lastReadMessageId: string | null;
    lastReadAt: Date | null;
}

export interface AdvanceReadResult {
    /**
     * Watermark row BEFORE this ack landed. `null` if this is the first ack
     * for the (conversationId, userId) pair (upsert created it). The
     * orchestrator uses `prev.lastReadMessageId` as the lower bound of the
     * `(prev, messageId]` range when computing distinct senders to notify.
     */
    prev: ParticipantStateModel | null;

    /**
     * `false` when the incoming `messageId` did NOT beat the stored watermark
     * (stale or duplicate ack — `$max` silently absorbed it). The orchestrator
     * skips fan-out in this case: nothing newly read, nothing to broadcast.
     */
    advanced: boolean;
}

/**
 * Per-(conversation, user) read-state contract.
 *
 * Forward-only semantics: stale or out-of-order acks (multi-device reconnect
 * race, retried network call) are silently absorbed by `$max`. This is what
 * makes the design survive unreliable networks without locking or coordination.
 *
 * Shard-key alignment: every query carries `conversationId`. If
 * `participant_state` is co-sharded with `messages` on `conversationId`,
 * lookups stay single-shard — consistent with the Epic 6 ADR.
 */
export interface IParticipantStateRepository {
    advanceReadWatermark(
        conversationId: string,
        userId: string,
        messageId: string,
        readAt: Date,
    ): Promise<AdvanceReadResult>;

    /**
     * All watermark rows for a conversation. Used by the sender's UI on
     * conversation open to bootstrap ✓✓ rendering for every visible
     * message m where `m._id <= recipient.lastReadMessageId`.
     */
    findByConversation(
        conversationId: string,
    ): Promise<ParticipantStateModel[]>;
}
