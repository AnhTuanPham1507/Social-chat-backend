import { DomainEvent } from '../../core/domain-event.base';

export class PostDeletedEvent extends DomainEvent {
  constructor(
    readonly postId: string,
    readonly authorId: string,
  ) {
    super(postId);
  }

  get eventName(): string {
    return 'post.deleted';
  }
}
