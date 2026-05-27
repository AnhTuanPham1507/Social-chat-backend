import { DomainEvent } from '../../core/domain-event.base';

export class FriendRequestAcceptedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'friend-request.accepted';

  constructor(
    readonly friendRequestId: string,
    readonly senderId: string,
    readonly receiverId: string,
  ) {
    super(friendRequestId);
  }

  get eventName(): string {
    return FriendRequestAcceptedEvent.EVENT_NAME;
  }
}
