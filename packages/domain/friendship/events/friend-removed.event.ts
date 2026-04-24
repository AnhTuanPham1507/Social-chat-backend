import { DomainEvent } from '../../core/domain-event.base';

export class FriendRemovedEvent extends DomainEvent {
  constructor(
    readonly friendshipId: string,
    readonly userId: string,
    readonly friendId: string,
    readonly removedBy: string,
  ) {
    super(friendshipId);
  }

  get eventName(): string {
    return 'friendship.removed';
  }
}
