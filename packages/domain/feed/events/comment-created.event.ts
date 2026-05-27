import { DomainEvent } from '../../core/domain-event.base';

export class CommentCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'comment.created';

  constructor(
    readonly commentId: string,
    readonly postId: string,
    readonly authorId: string,
    readonly parentCommentId?: string,
  ) {
    super(commentId);
  }

  get eventName(): string {
    return CommentCreatedEvent.EVENT_NAME;
  }
}
