import { randomUUID } from 'crypto';

/**
 * Base class for integration events — the public contract between bounded contexts.
 *
 * Unlike `DomainEvent` (in-process, may leak domain concepts to same-context subscribers),
 * an `IntegrationEvent` is designed to cross service boundaries via Kafka.
 *
 * Subclasses MUST declare their topic:
 * ```ts
 * export class PostDeletedIntegrationEvent extends IntegrationEvent {
 *   static readonly TOPIC = 'feed.integration.post-deleted';
 *   constructor(readonly postId: string, readonly attachmentKeys: string[]) {
 *     super();
 *   }
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
