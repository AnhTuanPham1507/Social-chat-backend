import { DomainEvent } from '../../core/domain-event.base';
import { POST_VISIBILITY } from '../../post/post-visibility.enum';

export class PostSharedEvent extends DomainEvent {
  constructor(
    readonly sharePostId: string,
    readonly sharerId: string,
    readonly originalPostId: string,
    readonly originalAuthorId: string,
    readonly visibility: POST_VISIBILITY,
  ) {
    super(sharePostId);
  }

  get eventName(): string {
    return 'post.shared';
  }
}
