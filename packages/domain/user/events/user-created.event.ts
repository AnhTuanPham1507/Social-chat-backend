import { DomainEvent } from '../../core/domain-event.base';

/**
 * Domain event emitted when a new user is created.
 *
 * Consumers of this event might:
 * - Send a welcome email
 * - Initialize user preferences
 * - Create default notification settings
 * - Index user in search service
 */
export class UserCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'user.created';

  constructor(
    readonly userId: string,
    readonly email: string,
    readonly fullName: string,
  ) {
    super(userId);
  }

  get eventName(): string {
    return UserCreatedEvent.EVENT_NAME;
  }
}
