import { DomainEvent } from '../../core/domain-event.base';

export class FriendshipBlockedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'friendship.blocked';

  constructor(
    readonly friendshipId: string,
    readonly blockerId: string,
    readonly blockedId: string,
  ) {
    super(friendshipId);
  }

  get eventName(): string {
    return FriendshipBlockedEvent.EVENT_NAME;
  }
}
