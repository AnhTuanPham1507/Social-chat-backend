import { DomainEvent } from '../../core/domain-event.base';

export class CommentCreatedEvent extends DomainEvent {
  constructor(
    readonly commentId: string,
    readonly postId: string,
    readonly authorId: string,
    readonly parentCommentId?: string,
  ) {
    super(commentId);
  }

  get eventName(): string {
    return 'comment.created';
  }
}
