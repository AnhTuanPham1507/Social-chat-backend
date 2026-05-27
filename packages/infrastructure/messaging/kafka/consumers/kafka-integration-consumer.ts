import { EachMessagePayload, Kafka } from 'kafkajs';
import { BaseKafkaConsumer } from './base-kafka-consumer';
import { KafkaProducerService } from '../kafka-producer.service';
import { PermanentError } from '../errors';
import { DlqClassification, DlqRecord } from '../dlq';

/**
 * Default retry policy for transient errors. Total worst-case latency:
 * ~7s (1s + 2s + 4s). Sized to fit comfortably under typical 30s client
 * timeouts for the WS-driven send pipeline.
 *
 * Subclass override via constructor `options`.
 */
const DEFAULT_TRANSIENT_RETRY_BACKOFFS_MS = [1_000, 2_000, 4_000] as const;

export interface KafkaIntegrationConsumerOptions {
    /**
     * Backoff durations (ms) for transient-error retries. Length = number of
     * retry attempts. Defaults to [1s, 2s, 4s] (3 retries).
     */
    transientRetryBackoffsMs?: readonly number[];
}

/**
 * Kafka consumer for integration events with built-in error classification,
 * bounded retry-with-backoff for transient errors, and dead-letter-queue
 * routing for permanent errors and exhausted retries.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Error-handling contract (the load-bearing reason this base class exists)
 * ─────────────────────────────────────────────────────────────────────
 *
 * KafkaJS's `eachMessage` auto-commits the offset when the handler returns
 * normally, and pauses/redelivers the SAME offset indefinitely when the
 * handler throws. Neither default is what we want: silent-commit-on-error
 * (the previous behavior) loses transient errors that deserve a retry,
 * while throw-to-infinity stalls partitions on poison messages.
 *
 * This base class implements the textbook in-handler-retry-then-DLQ pattern:
 *
 *   1. Try `handleMessage(event)`.
 *   2. On success → return (commit offset).
 *   3. On `PermanentError` thrown by subclass → DLQ + onDeadLettered → return.
 *   4. On any other error → `classifyError(err)`:
 *        - 'permanent'           → DLQ + onDeadLettered → return.
 *        - 'transient'           → sleep backoff, retry. Up to N attempts
 *                                  per `transientRetryBackoffsMs`.
 *      After exhausting retries → DLQ + onDeadLettered → return.
 *
 * `processMessage` itself NEVER throws — Kafka always commits the offset.
 * Poison messages cannot stall a partition.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Two ways to signal "permanent" — which to use when
 * ─────────────────────────────────────────────────────────────────────
 *
 *   - `throw new PermanentError(cause, dlqContext)` — when the error is
 *     domain-specific and you want to attach structured context to the
 *     DLQ record (e.g. attemptedSenderId, existingSenderId on a UUID
 *     collision). The error itself carries the classification.
 *   - Override `classifyError()` — when a third-party error type
 *     (driver, framework, ORM) is known to be permanent regardless of
 *     context. Keeps domain-handling code free of throw-wrap noise.
 *
 * If neither rule is satisfied, prefer the hook. Don't use BOTH for the
 * same error type — pick one.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Subclass back-channel notifications belong in `onDeadLettered`
 * ─────────────────────────────────────────────────────────────────────
 *
 * If the subclass needs to tell the upstream caller "we gave up on this
 * message" (e.g. publish `message:rejected` to the sender via Redis
 * pub/sub), do it in `onDeadLettered` — not inline in `handleMessage`.
 * Reason: the subclass cannot see retry exhaustion (the base class
 * does that internally). Using the hook gives ONE back-channel code
 * path that covers permanent + transient-exhausted uniformly.
 *
 * Cost: ~5ms latency added before the back-channel publish (DLQ write
 * runs first). Acceptable for rejection paths, which are rare.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyConsumer extends KafkaIntegrationConsumer<MyEvent> {
 *   protected readonly topics = [MyEvent.TOPIC];
 *
 *   constructor(
 *     @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
 *     producer: KafkaProducerService,
 *   ) {
 *     super(kafka, 'my-group', producer);
 *   }
 *
 *   protected async handleMessage(event: MyEvent): Promise<void> {
 *     try {
 *       await doWork(event);
 *     } catch (err) {
 *       if (isCollision(err)) {
 *         throw new PermanentError(err, { messageId: event.id });
 *       }
 *       throw err; // bubble → classifyError decides
 *     }
 *   }
 *
 *   protected classifyError(err: unknown) {
 *     if (err instanceof MyValidationError) return 'permanent';
 *     return super.classifyError(err);
 *   }
 *
 *   protected async onDeadLettered(event, classification, cause) {
 *     await this.notifyUser(event, classification, cause);
 *   }
 * }
 * ```
 */
export abstract class KafkaIntegrationConsumer<T> extends BaseKafkaConsumer {
    private readonly _transientBackoffsMs: readonly number[];

    constructor(
        kafka: Kafka,
        protected readonly groupId: string,
        protected readonly producer: KafkaProducerService,
        options?: KafkaIntegrationConsumerOptions,
    ) {
        super(kafka, groupId);
        this._transientBackoffsMs =
            options?.transientRetryBackoffsMs ?? DEFAULT_TRANSIENT_RETRY_BACKOFFS_MS;
    }

    protected async processMessage(payload: EachMessagePayload): Promise<void> {
        const { topic, partition, message } = payload;
        const value = message.value?.toString();

        if (!value) {
            this.logger.warn(
                `Empty message on topic=${topic} partition=${partition} — skipping`,
            );
            return;
        }

        let event: T;
        try {
            event = JSON.parse(value) as T;
        } catch (err) {
            // Malformed payload is permanent — retrying parses the same bytes.
            await this._deadLetter(
                payload,
                undefined as unknown as T,
                'permanent',
                0,
                err instanceof Error
                    ? err
                    : new Error(`JSON.parse failed: ${String(err)}`),
                { rawValue: value },
            );
            return;
        }

        // First attempt + transient retries.
        const maxAttempts = 1 + this._transientBackoffsMs.length;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                if (attempt > 0) {
                    this.logger.debug(
                        `Retry ${attempt}/${this._transientBackoffsMs.length} for topic=${topic} offset=${payload.message.offset}`,
                    );
                }
                await this.handleMessage(event);
                return; // success → commit
            } catch (err) {
                const error =
                    err instanceof Error ? err : new Error(String(err));

                if (error instanceof PermanentError) {
                    await this._deadLetter(
                        payload,
                        event,
                        'permanent',
                        attempt,
                        error.cause,
                        error.dlqContext,
                    );
                    return;
                }

                const classification = this.classifyError(error);
                if (classification === 'permanent') {
                    await this._deadLetter(
                        payload,
                        event,
                        'permanent',
                        attempt,
                        error,
                    );
                    return;
                }

                // transient — remember and possibly retry
                lastError = error;
                const isLastAttempt = attempt === maxAttempts - 1;
                if (isLastAttempt) break;

                const backoff = this._transientBackoffsMs[attempt];
                this.logger.warn(
                    `Transient error on topic=${topic} offset=${payload.message.offset} ` +
                        `(attempt ${attempt + 1}/${maxAttempts}) — retrying in ${backoff}ms: ` +
                        `${error.message}`,
                );
                await this._sleep(backoff);
            }
        }

        // All transient retries exhausted.
        await this._deadLetter(
            payload,
            event,
            'transient-exhausted',
            this._transientBackoffsMs.length,
            lastError ?? new Error('transient retries exhausted (no error captured)'),
        );
    }

    /**
     * Override to mark specific third-party error types as permanent
     * (skip retry) or transient (do retry). Default rules:
     *
     *   - TypeError / ReferenceError / SyntaxError — programming bugs, no
     *     amount of retry will heal them.
     *   - Errors with name `ValidationError` or `CastError` — Mongoose
     *     schema/cast violations. The data is the same on every retry,
     *     so the result will be the same. (Name-based check avoids a
     *     mongoose dependency in the base class.)
     *   - Everything else is treated as transient on the assumption that
     *     retries can heal it (Mongo blip, Redis disconnect, etc.).
     *
     * Subclass should opt-in known domain-permanent errors via override
     * (e.g. NestJS NotFoundException / ForbiddenException, validation pipe
     * rejections).
     */
    protected classifyError(err: unknown): 'permanent' | 'transient' {
        if (err instanceof TypeError) return 'permanent';
        if (err instanceof ReferenceError) return 'permanent';
        if (err instanceof SyntaxError) return 'permanent';
        if (err instanceof Error) {
            if (err.name === 'ValidationError') return 'permanent';
            if (err.name === 'CastError') return 'permanent';
        }
        return 'transient';
    }

    /**
     * Called once per dead-lettered message, AFTER the DLQ record is
     * written. Subclass override: publish back-channel notifications,
     * record domain-side metrics, raise alerts, etc. Failures here are
     * caught and logged; they do NOT prevent the offset from being
     * committed (the message is already in the DLQ).
     *
     * `event` may be `undefined` when DLQ was triggered by a JSON.parse
     * failure before the payload could be parsed.
     */
    protected async onDeadLettered(
        _event: T | undefined,
        _classification: DlqClassification,
        _cause: Error,
        _dlqContext?: Record<string, unknown>,
    ): Promise<void> {
        // default: no-op
    }

    protected abstract handleMessage(event: T): Promise<void>;

    private async _deadLetter(
        payload: EachMessagePayload,
        event: T | undefined,
        classification: DlqClassification,
        retryCount: number,
        cause: Error,
        dlqContext?: Record<string, unknown>,
    ): Promise<void> {
        const dlqTopic = `${payload.topic}.dlq`;
        const record: DlqRecord<T | undefined> = {
            originalEvent: event,
            originalTopic: payload.topic,
            originalPartition: payload.partition,
            originalOffset: payload.message.offset,
            originalTimestamp: payload.message.timestamp,
            consumerGroupId: this.groupId,
            classification,
            retryCount,
            error: {
                name: cause.name,
                message: cause.message,
                stack:
                    process.env.NODE_ENV === 'production' ? undefined : cause.stack,
            },
            dlqContext,
            dlqRecordedAt: new Date().toISOString(),
        };

        try {
            await this.producer.publish(
                dlqTopic,
                payload.message.key?.toString() ?? payload.message.offset,
                record,
            );
            this.logger.error(
                `DLQ topic=${dlqTopic} classification=${classification} ` +
                    `retryCount=${retryCount} cause=${cause.name}: ${cause.message}`,
            );
        } catch (publishErr) {
            // DLQ write failed — we still commit so we don't hot-loop on a
            // Kafka outage. The original cause is logged so ops can recover
            // from upstream logs if needed.
            this.logger.error(
                `DLQ publish FAILED on topic=${dlqTopic} — original cause=${cause.name}: ` +
                    `${cause.message}. DLQ-publish error: ` +
                    `${publishErr instanceof Error ? publishErr.message : publishErr}`,
            );
        }

        try {
            await this.onDeadLettered(event, classification, cause, dlqContext);
        } catch (hookErr) {
            this.logger.error(
                `onDeadLettered hook threw on topic=${payload.topic}: ` +
                    `${hookErr instanceof Error ? hookErr.message : hookErr}`,
            );
        }
    }

    private _sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
