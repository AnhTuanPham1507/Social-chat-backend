import { DomainEvent } from '../../core/domain-event.base';

export class FriendshipUnblockedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'friendship.unblocked';

  constructor(
    readonly friendshipId: string,
    readonly unblockerId: string,
    readonly unblockedId: string,
  ) {
    super(friendshipId);
  }

  get eventName(): string {
    return FriendshipUnblockedEvent.EVENT_NAME;
  }
}
