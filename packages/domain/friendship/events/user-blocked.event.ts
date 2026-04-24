import { DomainEvent } from '../../core/domain-event.base';

export class UserBlockedEvent extends DomainEvent {
  constructor(
    readonly friendshipId: string,
    readonly blockerId: string,
    readonly blockedId: string,
  ) {
    super(friendshipId);
  }

  get eventName(): string {
    return 'friendship.blocked';
  }
}
