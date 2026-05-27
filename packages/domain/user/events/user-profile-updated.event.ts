import { DomainEvent } from '../../core/domain-event.base';

/**
 * Domain event emitted when a user's profile is updated.
 *
 * Consumers of this event might:
 * - Update search index
 * - Invalidate cached user data
 * - Notify friends of profile changes
 */
export class UserProfileUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'user.profile-updated';

  constructor(
    readonly userId: string,
    readonly updatedFields: string[],
  ) {
    super(userId);
  }

  get eventName(): string {
    return UserProfileUpdatedEvent.EVENT_NAME;
  }
}
