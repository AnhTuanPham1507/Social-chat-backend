/**
 * Schema for a dead-letter record. Written by `KafkaIntegrationConsumer`'s
 * base class when a message is classified permanent OR exhausts the
 * transient-retry budget.
 *
 * Topic convention: `<source-topic>.dlq` (per source topic). Same payload
 * shape regardless of source topic — operators can drain a DLQ generically.
 */
export type DlqClassification = 'permanent' | 'transient-exhausted';

export interface DlqRecord<T = unknown> {
    /** The parsed integration event as received by the consumer. */
    originalEvent: T;

    /** Source topic, partition, offset, and timestamp — for replay tooling. */
    originalTopic: string;
    originalPartition: number;
    originalOffset: string;
    originalTimestamp: string;

    /** Consumer group that DLQ'd the message. */
    consumerGroupId: string;

    /** Why we DLQ'd it. */
    classification: DlqClassification;

    /** How many retry attempts happened before DLQ. 0 for `permanent`. */
    retryCount: number;

    /** Snapshot of the error that caused the DLQ. Stack only in non-prod. */
    error: {
        name: string;
        message: string;
        stack?: string;
    };

    /** Structured metadata supplied by the subclass via `PermanentError`. */
    dlqContext?: Record<string, unknown>;

    /** ISO timestamp the DLQ record was written. */
    dlqRecordedAt: string;
}
