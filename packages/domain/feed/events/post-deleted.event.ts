import { DomainEvent } from '../../core/domain-event.base';
import { PostSnapshot } from '../post-snapshot';

export class PostDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'post.deleted';

  constructor(readonly postSnapshot: PostSnapshot) {
    super(postSnapshot.id);
  }

  get eventName(): string {
    return PostDeletedEvent.EVENT_NAME;
  }
}
