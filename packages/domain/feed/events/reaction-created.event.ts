import { DomainEvent } from '../../core/domain-event.base';
import { CONTENT_TYPE } from '../../reaction/content-type.enum';
import { REACTION_TYPE } from '../../reaction/reaction-type.enum';

export class ReactionCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'reaction.created';

  constructor(
    readonly reactionId: string,
    readonly contentId: string,
    readonly contentType: CONTENT_TYPE,
    readonly userId: string,
    readonly reactionType: REACTION_TYPE,
  ) {
    super(reactionId);
  }

  get eventName(): string {
    return ReactionCreatedEvent.EVENT_NAME;
  }
}
