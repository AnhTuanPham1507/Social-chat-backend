import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { DomainEvent } from '@social-chat/domain';
import { KAFKA_CLIENT_TOKEN } from './kafka.config';

/**
 * Wraps the kafkajs Producer.
 *
 * Receives the shared Kafka instance from the module via DI.
 * Manages only the producer lifecycle (connect/disconnect).
 */
@Injectable()
export class KafkaProducerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly producer: Producer;

  constructor(
    @Inject(KAFKA_CLIENT_TOKEN)
    private readonly kafka: Kafka,
  ) {
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  /**
   * Publishes a domain event to Kafka.
   *
   * Key: aggregateId — guarantees ordering per aggregate within a partition.
   * Value: Full event envelope as JSON.
   * Topic: <aggregateType>.<eventName> (e.g., 'user.user.created')
   */
  async send(event: DomainEvent): Promise<void> {
    const topic = this.buildTopicName(event);

    await this.producer.send({
      topic,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event.toJSON()),
        },
      ],
    });

    this.logger.debug(
      `Event published to topic "${topic}" | eventId=${event.eventId} aggregateId=${event.aggregateId}`,
    );
  }

  /**
   * Publishes multiple domain events in a single batch request.
   * Events may target different topics — kafkajs groups them automatically.
   * More efficient than calling send() in a loop.
   */
  async sendBatch(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const topicMessages = events.map((event) => ({
      topic: this.buildTopicName(event),
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event.toJSON()),
        },
      ],
    }));

    await this.producer.sendBatch({ topicMessages });

    this.logger.debug(
      `Batch published ${events.length} events | aggregateId=${events[0].aggregateId}`,
    );
  }

  private buildTopicName(event: DomainEvent): string {
    return `${event.aggregateType}.${event.eventName}`;
  }
}
