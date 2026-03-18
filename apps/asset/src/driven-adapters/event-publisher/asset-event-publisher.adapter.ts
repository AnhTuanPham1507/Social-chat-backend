import { Injectable } from '@nestjs/common';
import { DomainEvent, IEventPublisher } from '@social-chat/domain';
import { KafkaProducerService } from '@social-chat/infrastructure';

@Injectable()
export class AssetEventPublisherAdapter implements IEventPublisher {
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
