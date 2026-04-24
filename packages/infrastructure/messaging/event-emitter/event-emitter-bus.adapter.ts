import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, IDomainEventBus } from '@social-chat/domain';

/**
 * In-process domain event bus backed by `@nestjs/event-emitter`.
 *
 * Publishes domain events to listeners in the same Node process. Cross-context
 * communication still goes through Kafka via integration events — a translator
 * listener subscribes here and re-publishes as an integration event.
 */
@Injectable()
export class EventEmitterBusAdapter implements IDomainEventBus {
    constructor(private readonly _emitter: EventEmitter2) {}

    async publish(event: DomainEvent): Promise<void> {
        await this._emitter.emitAsync(event.eventName, event);
    }

    async publishAll(events: ReadonlyArray<DomainEvent>): Promise<void> {
        for (const event of events) {
            await this._emitter.emitAsync(event.eventName, event);
        }
    }
}
