import { IKafkaAppConfig } from './interfaces/kafka-config.interface';

export const getKafkaConfig = (): IKafkaAppConfig => ({
  brokers: (process.env.KAFKA_BROKERS || 'localhost:29092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'social-chat',
  groupId: process.env.KAFKA_GROUP_ID || 'social-chat-group',
});
