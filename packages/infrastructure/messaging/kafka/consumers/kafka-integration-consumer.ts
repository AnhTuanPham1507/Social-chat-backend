import { EachMessagePayload, Kafka } from 'kafkajs';
import { BaseKafkaConsumer } from './base-kafka-consumer';

/**
 * Kafka consumer for integration events.
 *
 * Unlike `KafkaBaseConsumer` (which assumes the DomainEvent envelope shape with
 * `{ eventName, aggregateId, aggregateType, payload: {...} }`), integration events
 * are flat JSON: the base fields (`eventId`, `occurredOn`, `eventVersion`) sit
 * alongside the event-specific fields on the same object.
 *
 * Subclasses declare the integration event shape as `T` and receive a parsed
 * object. Deserialization is `JSON.parse` only — no class reconstruction. Methods
 * on the integration event class are not available on the consumer side.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PostDeletedCleanupConsumer extends KafkaIntegrationConsumer<PostDeletedIntegrationEvent> {
 *   protected readonly topics = [PostDeletedIntegrationEvent.TOPIC];
 *
 *   constructor(@Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka) {
 *     super(kafka, 'asset-post-deleted-cleanup-group');
 *   }
 *
 *   protected async handleMessage(event: PostDeletedIntegrationEvent): Promise<void> {
 *     // event.postSnapshot.attachmentKeys, event.cascadedCommentSnapshots, ...
 *   }
 * }
 * ```
 */
export abstract class KafkaIntegrationConsumer<T> extends BaseKafkaConsumer {
  constructor(kafka: Kafka, groupId: string) {
    super(kafka, groupId);
  }

  protected async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const value = message.value?.toString();

    if (!value) {
      this.logger.warn(
        `Empty message received on topic=${topic} partition=${partition}`,
      );
      return;
    }

    try {
      const event: T = JSON.parse(value);
      this.logger.debug(`Processing integration event on topic=${topic}`);
      await this.handleMessage(event);
    } catch (error) {
      this.logger.error(
        `Failed to process message on topic=${topic} partition=${partition}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  protected abstract handleMessage(event: T): Promise<void>;
}
