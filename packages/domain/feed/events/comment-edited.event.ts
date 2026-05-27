import { DomainEvent } from '../../core/domain-event.base';

export class CommentEditedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'comment.edited';

  constructor(
    readonly commentId: string,
    readonly postId: string,
    readonly authorId: string,
  ) {
    super(commentId);
  }

  get eventName(): string {
    return CommentEditedEvent.EVENT_NAME;
  }
}
