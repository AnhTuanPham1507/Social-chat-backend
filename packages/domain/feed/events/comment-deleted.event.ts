import { DomainEvent } from '../../core/domain-event.base';
import { CommentSnapshot } from '../comment-snapshot';

export class CommentDeletedEvent extends DomainEvent {
  constructor(readonly commentSnapshot: CommentSnapshot) {
    super(commentSnapshot.id);
  }

  get eventName(): string {
    return 'comment.deleted';
  }
}
