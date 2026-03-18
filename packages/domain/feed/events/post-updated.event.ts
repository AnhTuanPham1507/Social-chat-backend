import { DomainEvent } from '../../core/domain-event.base';

export class PostUpdatedEvent extends DomainEvent {
  constructor(
    readonly postId: string,
    readonly updatedFields: string[],
  ) {
    super(postId);
  }

  get eventName(): string {
    return 'post.updated';
  }
}
