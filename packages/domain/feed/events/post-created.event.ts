import { DomainEvent } from '../../core/domain-event.base';
import { POST_VISIBILITY } from '../../post/post-visibility.enum';

export class PostCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'post.created';

  constructor(
    readonly postId: string,
    readonly authorId: string,
    readonly visibility: POST_VISIBILITY,
  ) {
    super(postId);
  }

  get eventName(): string {
    return PostCreatedEvent.EVENT_NAME;
  }
}
