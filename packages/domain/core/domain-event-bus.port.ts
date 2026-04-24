import { DomainEvent } from './domain-event.base';

/**
 * Port for the in-process domain event bus.
 *
 * A driven port in hexagonal architecture. Subscribers within the same
 * bounded context (e.g., translators) react to domain events synchronously
 * in the same Node process — no network hop, no serialization.
 *
 * Distinct from `IEventPublisher`, which publishes events across service
 * boundaries (Kafka). Domain events stay internal; if another bounded
 * context needs to react, a translator subscribes to the domain event
 * and publishes an integration event (see `IntegrationEvent` in @social-chat/common).
 *
 * @example
 * ```typescript
 * @CommandHandler(DeletePostCommand)
 * export class DeletePostHandler {
 *   constructor(
 *     @Inject(DOMAIN_EVENT_BUS_TOKEN)
 *     private readonly _eventBus: IDomainEventBus,
 *   ) {}
 *
 *   async execute(cmd: DeletePostCommand): Promise<void> {
 *     const post = await this._postRepo.findById(cmd.postId);
 *     post.delete();
 *     await this._postRepo.update(post);
 *     await this._eventBus.publishAll(post.publishEvents());
 *   }
 * }
 * ```
 */
export interface IDomainEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

export const DOMAIN_EVENT_BUS_TOKEN = Symbol('DOMAIN_EVENT_BUS_TOKEN');
