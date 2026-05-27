import { DomainEvent } from '../../core/domain-event.base';

export class PostUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'post.updated';

  constructor(
    readonly postId: string,
    readonly updatedFields: string[],
  ) {
    super(postId);
  }

  get eventName(): string {
    return PostUpdatedEvent.EVENT_NAME;
  }
}
