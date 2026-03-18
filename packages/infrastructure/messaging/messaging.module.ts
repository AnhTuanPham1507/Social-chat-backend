import { DynamicModule, Global, Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { KafkaProducerService } from './kafka-producer.service';
import { IKafkaConfig, KAFKA_CLIENT_TOKEN, KAFKA_CONFIG_TOKEN } from './kafka.config';

export interface MessagingModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<IKafkaConfig> | IKafkaConfig;
  inject?: any[];
}

/**
 * Messaging module — provides Kafka client, producer, and EVENT_PUBLISHER.
 *
 * Creates a single Kafka instance shared by both producer and consumers.
 * Consumers are registered separately in each service module.
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * imports: [
 *   MessagingModule.forRootAsync({
 *     useFactory: (configService: ConfigService) => ({
 *       brokers: configService.get<string>('KAFKA_BROKERS').split(','),
 *       clientId: 'auth-service',
 *       groupId: 'auth-service-group',
 *     }),
 *     inject: [ConfigService],
 *   }),
 * ]
 * ```
 */
@Global()
@Module({})
export class MessagingModule {
  static forRootAsync(options: MessagingModuleAsyncOptions): DynamicModule {
    const kafkaConfigProvider = {
      provide: KAFKA_CONFIG_TOKEN,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const kafkaClientProvider = {
      provide: KAFKA_CLIENT_TOKEN,
      useFactory: (config: IKafkaConfig): Kafka => {
        return new Kafka({
          clientId: config.clientId,
          brokers: config.brokers,
          connectionTimeout: config.connectionTimeout ?? 3000,
          requestTimeout: config.requestTimeout ?? 30000,
          retry: {
            retries: config.retry?.retries ?? 5,
            initialRetryTime: config.retry?.initialRetryTime ?? 300,
            maxRetryTime: config.retry?.maxRetryTime ?? 30000,
          },
        });
      },
      inject: [KAFKA_CONFIG_TOKEN],
    };

    return {
      module: MessagingModule,
      global: true,
      providers: [
        kafkaConfigProvider,
        kafkaClientProvider,
        KafkaProducerService,
      ],
      exports: [KAFKA_CLIENT_TOKEN, KAFKA_CONFIG_TOKEN, KafkaProducerService],
    };
  }
}
