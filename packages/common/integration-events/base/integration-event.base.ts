import { randomUUID } from 'crypto';

/**
 * Base class for integration events — the public contract between bounded contexts.
 *
 * Unlike `DomainEvent` (in-process, may leak domain concepts to same-context subscribers),
 * an `IntegrationEvent` is designed to cross service boundaries via Kafka.
 *
 * Subclasses MUST declare their topic.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Kafka topic-shape convention
 * ─────────────────────────────────────────────────────────────────────
 * Two patterns are in use, picked deliberately based on intent:
 *
 * 1. **Integration events (facts) → one topic per event-type.**
 *    Pattern: `<context>.integration.<aggregate>-<verb-past-tense>`
 *    Example: `feed.integration.post-deleted`, `feed.integration.comment-deleted`
 *    Why: independent schema evolution, granular consumer subscription,
 *    isolated blast radius. Cross-type ordering on the same key is not
 *    required because downstream consumers denormalize independently.
 *
 * 2. **Commands (imperative requests) → one topic per context, type-discriminated.**
 *    Pattern: `<context>.commands` with `commandType` field on the payload
 *    Example: `messaging.commands` with `commandType: 'send-text' | 'delete-message' | ...`
 *    Why: ordering matters. All commands targeting the same aggregate key
 *    (e.g. `conversationId`) MUST land on the same partition in order so
 *    that downstream effects (e.g. send-then-delete) apply consistently.
 *
 * Pick (1) for *something happened*, (2) for *do this*. Don't mix them
 * within the same logical channel.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Examples
 * ─────────────────────────────────────────────────────────────────────
 * ```ts
 * // Integration event
 * export class PostDeletedIntegrationEvent extends IntegrationEvent {
 *   static readonly TOPIC = 'feed.integration.post-deleted';
 *   constructor(readonly postId: string, readonly attachmentKeys: string[]) {
 *     super();
 *   }
 * }
 *
 * // Command (multiple types share one topic)
 * export class SendTextCommand extends IntegrationEvent {
 *   static readonly TOPIC = 'messaging.commands';
 *   static readonly COMMAND_TYPE = 'send-text';
 *   readonly commandType: 'send-text' = 'send-text';
 *   // ...
 * }
 * ```
 *
 * Deliberately omitted:
 * - `aggregateId` — leaks a domain concept; put the ID in the payload with its
 *   real name (`postId`, `commentId`, etc.).
 * - `eventName` — the Kafka topic is already the event's public identifier.
 * - `requestId` / correlation — deferred to a future OpenTelemetry adoption.
 */
export abstract class IntegrationEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventVersion: number = 1;

  constructor() {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
  }
}
