import { DomainEvent } from '../../core/domain-event.base';

export class CommentEditedEvent extends DomainEvent {
  constructor(
    readonly commentId: string,
    readonly postId: string,
    readonly authorId: string,
  ) {
    super(commentId);
  }

  get eventName(): string {
    return 'comment.edited';
  }
}
