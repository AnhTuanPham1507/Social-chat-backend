import {
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Admin, Consumer, EachMessagePayload, Kafka } from 'kafkajs';

/**
 * Abstract base class for all Kafka consumers.
 *
 * Handles the shared Kafka lifecycle: connect, subscribe, run, shutdown.
 * Subclasses define their own groupId, topics, and message parsing.
 *
 * @param kafka - Shared Kafka instance (from KAFKA_CLIENT_TOKEN)
 * @param groupId - Each consumer defines its own consumer group
 */
export abstract class BaseKafkaConsumer
  implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown
{
  protected readonly logger: Logger;
  private readonly consumer: Consumer;
  private readonly admin: Admin;

  protected abstract readonly topics: string[];
  protected readonly fromBeginning: boolean = false;

  constructor(kafka: Kafka, groupId: string) {
    this.logger = new Logger(this.constructor.name);
    this.consumer = kafka.consumer({ groupId });
    this.admin = kafka.admin();
  }

  async onModuleInit(): Promise<void> {
    await this.ensureTopicsExist();

    await this.consumer.connect();
    this.logger.log('Kafka consumer connected');

    for (const topic of this.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: this.fromBeginning });
      this.logger.log(`Subscribed to topic: ${topic} (fromBeginning=${this.fromBeginning})`);
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.processMessage(payload);
      },
    });
  }

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

  protected abstract processMessage(payload: EachMessagePayload): Promise<void>;
}
