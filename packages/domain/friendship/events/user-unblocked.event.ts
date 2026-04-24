import { DomainEvent } from '../../core/domain-event.base';

export class UserUnblockedEvent extends DomainEvent {
  constructor(
    readonly friendshipId: string,
    readonly unblockerId: string,
    readonly unblockedId: string,
  ) {
    super(friendshipId);
  }

  get eventName(): string {
    return 'friendship.unblocked';
  }
}
