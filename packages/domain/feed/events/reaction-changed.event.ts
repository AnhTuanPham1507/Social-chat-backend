import { DomainEvent } from '../../core/domain-event.base';
import { CONTENT_TYPE } from '../../reaction/content-type.enum';
import { REACTION_TYPE } from '../../reaction/reaction-type.enum';

export class ReactionChangedEvent extends DomainEvent {
  constructor(
    readonly reactionId: string,
    readonly contentId: string,
    readonly contentType: CONTENT_TYPE,
    readonly userId: string,
    readonly oldType: REACTION_TYPE,
    readonly newType: REACTION_TYPE,
  ) {
    super(reactionId);
  }

  get eventName(): string {
    return 'reaction.changed';
  }
}
