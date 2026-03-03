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
  constructor(
    readonly userId: string,
    readonly updatedFields: string[],
  ) {
    super();
  }

  get eventName(): string {
    return 'user.profile_updated';
  }
}
