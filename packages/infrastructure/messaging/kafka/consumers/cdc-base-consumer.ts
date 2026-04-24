import { EachMessagePayload, Kafka } from 'kafkajs';
import { BaseKafkaConsumer } from './base-kafka-consumer';

/**
 * Debezium CDC operation types.
 * - c: create (INSERT)
 * - u: update (UPDATE)
 * - d: delete (DELETE)
 * - r: read (snapshot)
 */
export type CdcOperation = 'c' | 'u' | 'd' | 'r';

/**
 * Debezium CDC message envelope.
 *
 * @template T The row shape of the watched table.
 */
export interface DebeziumMessage<T = Record<string, unknown>> {
  before: T | null;
  after: T | null;
  source: {
    connector: string;
    db: string;
    schema: string;
    table: string;
    ts_ms: number;
  };
  op: CdcOperation;
  ts_ms: number;
}

/**
 * Kafka consumer for Debezium CDC events.
 *
 * Parses messages as DebeziumMessage — the envelope format produced by Debezium connectors.
 * Each concrete consumer passes its own groupId via super().
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class FeedCdcConsumer extends CdcBaseConsumer {
 *   protected readonly topics = [
 *     'social-chat-cdc.public.posts',
 *     'social-chat-cdc.public.post_reactions',
 *   ];
 *
 *   constructor(@Inject(KAFKA_CLIENT_TOKEN) kafka: Kafka) {
 *     super(kafka, 'feed-cdc-group');
 *   }
 *
 *   protected async handleCdcMessage(
 *     table: string,
 *     message: DebeziumMessage,
 *   ): Promise<void> {
 *     // process by table and operation
 *   }
 * }
 * ```
 */
export abstract class CdcBaseConsumer extends BaseKafkaConsumer {
  protected readonly fromBeginning = true;

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
      const raw = JSON.parse(value);
      const cdcMessage: DebeziumMessage = raw.payload ?? raw;
      const table = cdcMessage.source.table;

      this.logger.debug(
        `Processing CDC op="${cdcMessage.op}" table="${table}" topic=${topic}`,
      );

      await this.handleCdcMessage(table, cdcMessage);
    } catch (error) {
      this.logger.error(
        `Failed to process CDC message on topic=${topic} partition=${partition}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  protected abstract handleCdcMessage(
    table: string,
    message: DebeziumMessage,
  ): Promise<void>;
}
