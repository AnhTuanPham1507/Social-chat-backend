import { randomUUID } from 'crypto';

/**
 * Base class for all domain events.
 *
 * Domain events represent something that happened in the domain that domain experts care about.
 * They are immutable and named in past tense (e.g., UserCreatedEvent, OrderPlacedEvent).
 *
 * @example
 * ```typescript
 * export class UserCreatedEvent extends DomainEvent {
 *   constructor(
 *     readonly userId: string,
 *     readonly email: string,
 *   ) {
 *     super();
 *   }
 *
 *   get eventName(): string {
 *     return 'user.created';
 *   }
 * }
 * ```
 */
export abstract class DomainEvent {
  /**
   * Unique identifier for this event instance.
   * Used for idempotency and event tracking.
   */
  readonly eventId: string;

  /**
   * Timestamp when the event occurred.
   */
  readonly occurredOn: Date;

  /**
   * Version of the event schema.
   * Useful for event evolution and backward compatibility.
   */
  readonly eventVersion: number = 1;

  constructor() {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
  }

  /**
   * Returns the name of the event in dot notation.
   * Convention: {aggregate}.{action} (e.g., 'user.created', 'post.published')
   */
  abstract get eventName(): string;

  /**
   * Returns the aggregate type this event belongs to.
   * Derived from eventName (e.g., 'user' from 'user.created')
   */
  get aggregateType(): string {
    return this.eventName.split('.')[0];
  }

  /**
   * Serializes the event to a plain object for persistence or messaging.
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      aggregateType: this.aggregateType,
      payload: this.getPayload(),
    };
  }

  /**
   * Returns the event-specific payload.
   * Override this method to customize the serialized payload.
   */
  protected getPayload(): Record<string, unknown> {
    // Get all own properties except base class properties
    const baseProps = ['eventId', 'occurredOn', 'eventVersion'];
    const payload: Record<string, unknown> = {};

    for (const key of Object.keys(this)) {
      if (!baseProps.includes(key)) {
        payload[key] = (this as Record<string, unknown>)[key];
      }
    }

    return payload;
  }
}
