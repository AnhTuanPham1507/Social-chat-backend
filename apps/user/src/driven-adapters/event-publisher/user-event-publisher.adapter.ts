import { Injectable } from '@nestjs/common';
import { DomainEvent, IEventPublisher } from '@social-chat/domain';
import { KafkaProducerService } from '@social-chat/infrastructure';

/**
 * Driven adapter for publishing User aggregate domain events.
 * Delegates to KafkaProducerService for actual Kafka communication.
 */
@Injectable()
export class UserEventPublisherAdapter implements IEventPublisher {
  constructor(
    private readonly _kafkaProducerService: KafkaProducerService,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    await this._kafkaProducerService.send(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await this._kafkaProducerService.sendBatch(events);
  }
}
