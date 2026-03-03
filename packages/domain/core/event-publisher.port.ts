import { DomainEvent } from './domain-event.base';

/**
 * Port interface for publishing domain events.
 *
 * This is a driven port (secondary port) in hexagonal architecture.
 * Implementations can use Kafka, RabbitMQ, in-memory, etc.
 *
 * @example
 * ```typescript
 * // In command handler
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
 *   constructor(
 *     @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
 *     @Inject(EVENT_PUBLISHER) private readonly eventPublisher: IEventPublisher,
 *   ) {}
 *
 *   async execute(command: CreateUserCommand): Promise<string> {
 *     const user = UserAggregate.create({ ... });
 *
 *     await this.userRepo.save(user);
 *     await this.eventPublisher.publishAll(user.domainEvents);
 *     user.clearDomainEvents();
 *
 *     return user.id;
 *   }
 * }
 * ```
 */
export interface IEventPublisher {
  /**
   * Publishes a single domain event.
   * @param event - The domain event to publish
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publishes multiple domain events in order.
   * @param events - Array of domain events to publish
   */
  publishAll(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

/**
 * Injection token for the event publisher.
 * Use with @Inject(EVENT_PUBLISHER) in NestJS.
 */
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
