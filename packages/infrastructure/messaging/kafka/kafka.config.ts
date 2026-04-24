/**
 * Kafka configuration interface.
 * Follows the same pattern as IMinioConfig — the consuming app
 * provides these values via ConfigService in forRootAsync().
 */
export interface IKafkaConfig {
  brokers: string[];
  clientId: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  retry?: {
    retries: number;
    initialRetryTime?: number;
    maxRetryTime?: number;
  };
}

export const KAFKA_CONFIG_TOKEN = Symbol('KAFKA_CONFIG_TOKEN');
export const KAFKA_CLIENT_TOKEN = Symbol('KAFKA_CLIENT_TOKEN');
