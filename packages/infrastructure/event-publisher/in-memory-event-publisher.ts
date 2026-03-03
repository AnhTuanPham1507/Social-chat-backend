import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, IEventPublisher } from '@social-chat/domain';

/**
 * In-memory event publisher for development and testing.
 *
 * This implementation:
 * - Logs events to console for debugging
 * - Stores events in memory for testing assertions
 * - Can be replaced with KafkaEventPublisher in production
 *
 * @example
 * ```typescript
 * // In tests
 * const publisher = new InMemoryEventPublisher();
 * await publisher.publish(new UserCreatedEvent(...));
 *
 * expect(publisher.publishedEvents).toHaveLength(1);
 * expect(publisher.publishedEvents[0]).toBeInstanceOf(UserCreatedEvent);
 * ```
 */
@Injectable()
export class InMemoryEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(InMemoryEventPublisher.name);
  private _publishedEvents: DomainEvent[] = [];

  /**
   * Returns all events that have been published.
   * Useful for testing assertions.
   */
  get publishedEvents(): ReadonlyArray<DomainEvent> {
    return [...this._publishedEvents];
  }

  /**
   * Publishes a single domain event.
   * Logs the event and stores it in memory.
   */
  async publish(event: DomainEvent): Promise<void> {
    this._publishedEvents.push(event);

    this.logger.log({
      message: 'Domain event published',
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateType: event.aggregateType,
      occurredOn: event.occurredOn.toISOString(),
      payload: event.toJSON().payload,
    });
  }

  /**
   * Publishes multiple domain events in order.
   */
  async publishAll(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Clears all published events.
   * Useful for resetting state between tests.
   */
  clear(): void {
    this._publishedEvents = [];
  }

  /**
   * Returns events filtered by event name.
   * Useful for testing specific event types.
   */
  getEventsByName(eventName: string): DomainEvent[] {
    return this._publishedEvents.filter((e) => e.eventName === eventName);
  }

  /**
   * Returns the last published event, or undefined if none.
   */
  getLastEvent(): DomainEvent | undefined {
    return this._publishedEvents[this._publishedEvents.length - 1];
  }
}
