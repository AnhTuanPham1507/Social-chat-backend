import {
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Admin, Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { IKafkaConfig } from './kafka.config';

/**
 * Deserialized event message from Kafka.
 * Matches the envelope produced by DomainEvent.toJSON().
 */
export interface KafkaEventMessage {
  eventId: string;
  aggregateId: string;
  eventName: string;
  eventVersion: number;
  occurredOn: string;
  aggregateType: string;
  payload: Record<string, unknown>;
}

/**
 * Abstract base class for Kafka consumers.
 *
 * Receives the shared Kafka instance via DI (same instance as the producer).
 * Each microservice extends this to create specific consumers.
 *
 * Lifecycle:
 * - onModuleInit: connect and start consuming
 * - onModuleDestroy: stop fetching (graceful — in-flight messages finish)
 * - onApplicationShutdown: disconnect
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserEventsConsumer extends KafkaBaseConsumer {
 *   protected readonly topics = ['user.user.created'];
 *
 *   constructor(
 *     @Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka,
 *     @Inject(KAFKA_CONFIG_TOKEN) config: IKafkaConfig,
 *     private readonly appService: AssetApplicationService,
 *   ) {
 *     super(kafka, config);
 *   }
 *
 *   protected async handleMessage(message: KafkaEventMessage): Promise<void> {
 *     switch (message.eventName) {
 *       case 'user.created':
 *         await this.appService.handleUserCreated(message.payload);
 *         break;
 *     }
 *   }
 * }
 * ```
 */
export abstract class KafkaBaseConsumer
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  protected readonly logger: Logger;
  private readonly consumer: Consumer;
  private readonly admin: Admin;

  /**
   * Topics this consumer subscribes to.
   * Each concrete consumer defines its own topics.
   */
  protected abstract readonly topics: string[];

  constructor(
    kafka: Kafka,
    config: IKafkaConfig,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.consumer = kafka.consumer({ groupId: config.groupId });
    this.admin = kafka.admin();
  }

  async onModuleInit(): Promise<void> {
    await this.ensureTopicsExist();

    await this.consumer.connect();
    this.logger.log('Kafka consumer connected');

    for (const topic of this.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.logger.log(`Subscribed to topic: ${topic}`);
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.processMessage(payload);
      },
    });
  }

  /**
   * Ensures all topics exist before subscribing.
   * Creates missing topics using the Kafka Admin API.
   */
  private async ensureTopicsExist(): Promise<void> {
    await this.admin.connect();

    try {
      const existingTopics = await this.admin.listTopics();
      const missingTopics = this.topics.filter(
        (topic) => !existingTopics.includes(topic),
      );

      if (missingTopics.length > 0) {
        this.logger.log(`Creating missing topics: ${missingTopics.join(', ')}`);

        await this.admin.createTopics({
          topics: missingTopics.map((topic) => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
          })),
        });

        this.logger.log(`Topics created: ${missingTopics.join(', ')}`);
      }
    } finally {
      await this.admin.disconnect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.stop();
    this.logger.log('Kafka consumer stopped (no new messages will be fetched)');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const value = message.value?.toString();

    if (!value) {
      this.logger.warn(
        `Empty message received on topic=${topic} partition=${partition}`,
      );
      return;
    }

    try {
      const event: KafkaEventMessage = JSON.parse(value);

      this.logger.debug(
        `Processing event="${event.eventName}" eventId=${event.eventId} aggregateId=${event.aggregateId}`,
      );

      await this.handleMessage(event);
    } catch (error) {
      this.logger.error(
        `Failed to process message on topic=${topic} partition=${partition}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  protected abstract handleMessage(message: KafkaEventMessage): Promise<void>;
}
