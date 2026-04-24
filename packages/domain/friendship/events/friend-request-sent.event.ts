import { DomainEvent } from '../../core/domain-event.base';

export class FriendRequestSentEvent extends DomainEvent {
  constructor(
    readonly friendRequestId: string,
    readonly senderId: string,
    readonly receiverId: string,
  ) {
    super(friendRequestId);
  }

  get eventName(): string {
    return 'friend-request.sent';
  }
}
