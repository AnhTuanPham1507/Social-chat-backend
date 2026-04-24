import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Admin, Kafka, Producer } from 'kafkajs';
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
  private readonly admin: Admin;
  private readonly ensuredTopics = new Set<string>();

  constructor(
    @Inject(KAFKA_CLIENT_TOKEN)
    private readonly kafka: Kafka,
  ) {
    this.producer = this.kafka.producer();
    this.admin = this.kafka.admin();
  }

  async onModuleInit(): Promise<void> {
    await this.admin.connect();
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.producer.disconnect();
    await this.admin.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  /**
   * Ensures a topic exists with leaders elected before producing to it.
   * On a fresh KRaft cluster with auto-create enabled, the first produce
   * can race the leader election and fail with NOT_LEADER_FOR_PARTITION.
   * Calling createTopics with waitForLeaders:true blocks until the topic
   * is ready. Results are cached per topic so this only runs once.
   */
  private async ensureTopic(topic: string): Promise<void> {
    if (this.ensuredTopics.has(topic)) return;
    await this.admin.createTopics({
      topics: [{ topic, numPartitions: 3, replicationFactor: 1 }],
      waitForLeaders: true,
    });
    this.ensuredTopics.add(topic);
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
    await this.ensureTopic(topic);

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

    const uniqueTopics = new Set(topicMessages.map((tm) => tm.topic));
    for (const topic of uniqueTopics) {
      await this.ensureTopic(topic);
    }

    await this.producer.sendBatch({ topicMessages });

    this.logger.debug(
      `Batch published ${topicMessages.reduce((acc, tm) => `${acc} ${tm.topic},`, '')}| aggregateId=${events[0].aggregateId}`,
    );
  }

  private buildTopicName(event: DomainEvent): string {
    return `${event.aggregateType}.${event.eventName}`;
  }

  /**
   * Generic publish for events that aren't DomainEvents (e.g., IntegrationEvent).
   * Caller supplies the topic, partition key, and payload explicitly.
   */
  async publish(topic: string, key: string, payload: unknown): Promise<void> {
    await this.ensureTopic(topic);

    await this.producer.send({
      topic,
      messages: [
        {
          key,
          value: JSON.stringify(payload),
        },
      ],
    });

    this.logger.debug(`Published to "${topic}" | key=${key}`);
  }
}
