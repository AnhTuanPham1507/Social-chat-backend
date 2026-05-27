import { DomainEvent } from '../../core/domain-event.base';

export class FriendRequestSentEvent extends DomainEvent {
  static readonly EVENT_NAME = 'friend-request.sent';

  constructor(
    readonly friendRequestId: string,
    readonly senderId: string,
    readonly receiverId: string,
  ) {
    super(friendRequestId);
  }

  get eventName(): string {
    return FriendRequestSentEvent.EVENT_NAME;
  }
}
