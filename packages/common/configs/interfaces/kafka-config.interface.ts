export const KAFKA_CONFIG = 'KAFKA_CONFIG';

export interface IKafkaAppConfig {
  brokers: string[];
  clientId: string;
}
