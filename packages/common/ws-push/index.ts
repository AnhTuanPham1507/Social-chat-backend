/**
 * Wire envelope schema for back-channel pushes from backend services to
 * connected WebSocket clients via Redis pub/sub.
 *
 * NOT an integration event — these are NOT Kafka-bound, NOT durable, NOT a
 * stable public contract. They are the ephemeral over-the-wire format for
 * the realtime-gateway's outbound dispatcher.
 *
 * Channel partition:
 *   `user:{userId}`           — events targeted at one user (sender feedback,
 *                                personal notifications, membership changes)
 *   `conversation:{convId}`   — events broadcast to all members of a
 *                                conversation (new messages, typing, read
 *                                receipts)
 *
 * Per-pod subscribers ref-count subscriptions so a user with multiple
 * sockets only consumes one Redis subscription per channel.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Naming convention — `<subject>:<action>` (colon, kebab-case)
 * ─────────────────────────────────────────────────────────────────────
 * Four event families. Pick the family that matches the *intent*, then use
 * the matching verb mood:
 *
 * | Family       | Mood            | Examples
 * |--------------|-----------------|----------------------------------------
 * | Fact         | past-tense verb | message:created, message:rejected,
 * |              |                 | conversation:added, conversation:removed
 * | Progress     | progressive     | message:sending, typing:started
 * | Instruction  | imperative      | session:reconnect (server → client cmd)
 * | System       | bare verb       | ping, pong
 *
 * `message:failed` (this codebase) is a fact, not an instruction —
 * "your message failed to publish; you may retry with the same id". The
 * retry decision is the client's, encoded by the closed `code` enum.
 *
 * Don't mix moods within a subject. E.g. don't add `message:retry` next
 * to `message:failed` — keep the family consistent.
 */

export interface MessageCreatedEvent {
    event: 'message:created';
    messageId: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentKeys: string[];
    serverTs: string;
}

/**
 * Sent on the user:{userId} channel to tell the recipient (and trigger
 * the gateway pod they're connected to) that they have been added to a
 * conversation mid-session. The gateway both forwards this to the WS
 * client AND uses it to subscribe to the new `conversation:{convId}`
 * channel.
 */
export interface ConversationAddedEvent {
    event: 'conversation:added';
    conversationId: string;
}

/**
 * Symmetric to ConversationAddedEvent — the gateway unsubscribes from
 * `conversation:{convId}` after forwarding to the client.
 */
export interface ConversationRemovedEvent {
    event: 'conversation:removed';
    conversationId: string;
}

/**
 * Sent on the user:{senderId} channel to inform the original sender that
 * a previously-submitted message will never be persisted. The client
 * should flip the pending message from "sending" to "send failed" and
 * give the user the option to resend with a fresh messageId.
 *
 * `reason` is a closed string-literal union — extend it (not a free
 * string) as new permanent-failure modes are added, so clients get a
 * compile-time check on exhaustive handling.
 *   collision — different sender already owns this messageId
 *               (UUID collision or replay)
 *   internal  — unexpected backend failure (validation, persistence,
 *               etc.); not retried server-side, client may retry with
 *               a fresh messageId
 */
export type MessageRejectedReason = 'collision' | 'internal';

export interface MessageRejectedEvent {
    event: 'message:rejected';
    messageId: string;
    conversationId: string;
    reason: MessageRejectedReason;
}

/**
 * Broadcast on the conversation:{convId} channel after a member's read
 * watermark advances. Every connected member of the conversation receives
 * it and updates their local "who-has-read-what" map, used to render the
 * reader-avatar rail next to messages.
 *
 * Forward-only: server publishes only when `$max` actually moved the
 * watermark — stale or duplicate acks (multi-device race, retry) are
 * absorbed at the participant-state repo and never reach this event.
 *
 * Best-effort delivery: members offline at publish-time recover their
 * read state on next conversation-open via the bulk `participant-states`
 * fetch — Mongo is the source of truth, this push is the fast layer.
 */
export interface MessageReadEvent {
    event: 'message:read';
    conversationId: string;
    userId: string;
    lastReadMessageId: string;
    lastReadAt: string;
}

/**
 * Broadcast on `conversation:{convId}` when a participant's online status
 * changes. Subscribers use this to update the presence indicator in the
 * chat window without polling.
 */
export interface PresenceChangedEvent {
    event: 'presence:changed';
    userId: string;
    status: boolean;
    lastSeenAt: number | null;
}

/**
 * Broadcast on `conversation:{convId}` when a participant starts typing.
 * There is no `typing:stopped` event — clients start a 3-second client-side
 * timer on receipt and reset it on each new `typing:started`. This keeps the
 * gateway stateless for ephemeral, high-frequency events.
 */
export interface TypingEvent {
    event: 'typing:started';
    conversationId: string;
    userId: string;
}

export type WsPushEvent =
    | MessageCreatedEvent
    | ConversationAddedEvent
    | ConversationRemovedEvent
    | MessageRejectedEvent
    | MessageReadEvent
    | PresenceChangedEvent
    | TypingEvent;
