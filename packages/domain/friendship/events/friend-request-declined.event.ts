import { DomainEvent } from '../../core/domain-event.base';

export class FriendRequestDeclinedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'friend-request.declined';

  constructor(
    readonly friendRequestId: string,
    readonly senderId: string,
    readonly receiverId: string,
  ) {
    super(friendRequestId);
  }

  get eventName(): string {
    return FriendRequestDeclinedEvent.EVENT_NAME;
  }
}
