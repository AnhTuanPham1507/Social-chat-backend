import { DomainEvent } from '../../core/domain-event.base';
import { CommentSnapshot } from '../comment-snapshot';

export class CommentDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'comment.deleted';

  constructor(readonly commentSnapshot: CommentSnapshot) {
    super(commentSnapshot.id);
  }

  get eventName(): string {
    return CommentDeletedEvent.EVENT_NAME;
  }
}
