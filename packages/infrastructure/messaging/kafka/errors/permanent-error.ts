/**
 * Thrown from a `KafkaIntegrationConsumer` subclass's `handleMessage` to
 * tell the base class: do NOT retry this message; classify it as permanent
 * and route straight to the DLQ.
 *
 * Use when:
 *   - The error is domain-specific and unambiguously unrecoverable
 *     (e.g. UUIDv7 collision, conversation not found, sender-not-member).
 *   - You want to attach structured `dlqContext` for ops to inspect
 *     (e.g. attemptedSenderId, existingSenderId).
 *
 * For third-party errors whose type-based classification is the same
 * regardless of context (e.g. always-transient Mongo/Redis disconnect),
 * override `classifyError()` on the consumer instead — keeps the
 * domain-handling code free of throw-wrap noise.
 *
 * Re-throwing a `PermanentError` from within nested catch blocks is fine;
 * the base class checks `instanceof` and never retries.
 */
export class PermanentError extends Error {
    public readonly cause: Error;
    public readonly dlqContext?: Record<string, unknown>;

    constructor(cause: Error, dlqContext?: Record<string, unknown>) {
        super(cause.message);
        this.name = 'PermanentError';
        this.cause = cause;
        this.dlqContext = dlqContext;
    }
}
