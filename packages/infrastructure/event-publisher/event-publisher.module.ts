import { Global, Module } from '@nestjs/common';
import { EVENT_PUBLISHER } from '@social-chat/domain';
import { InMemoryEventPublisher } from './in-memory-event-publisher';

/**
 * Module that provides the event publisher for dependency injection.
 *
 * This module is marked as @Global so it can be imported once in the root module
 * and the EVENT_PUBLISHER token will be available throughout the application.
 *
 * In development/testing: Uses InMemoryEventPublisher
 * In production: Will be replaced with KafkaEventPublisher
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * @Module({
 *   imports: [EventPublisherModule],
 * })
 * export class AppModule {}
 *
 * // In any service
 * constructor(
 *   @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
 * ) {}
 * ```
 */
@Global()
@Module({
  providers: [
    {
      provide: EVENT_PUBLISHER,
      useClass: InMemoryEventPublisher,
    },
  ],
  exports: [EVENT_PUBLISHER],
})
export class EventPublisherModule {}
