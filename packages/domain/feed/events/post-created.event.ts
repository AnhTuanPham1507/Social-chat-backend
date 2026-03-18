import { DomainEvent } from '../../core/domain-event.base';
import { POST_VISIBILITY } from '../../post/post-visibility.enum';

export class PostCreatedEvent extends DomainEvent {
  constructor(
    readonly postId: string,
    readonly authorId: string,
    readonly visibility: POST_VISIBILITY,
  ) {
    super(postId);
  }

  get eventName(): string {
    return 'post.created';
  }
}
