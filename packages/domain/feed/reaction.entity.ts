import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { CONTENT_TYPE } from '../reaction/content-type.enum';
import { REACTION_TYPE } from '../reaction/reaction-type.enum';
import { ReactionCreatedEvent } from './events/reaction-created.event';
import { ReactionRemovedEvent } from './events/reaction-removed.event';
import { ReactionChangedEvent } from './events/reaction-changed.event';

interface ReactionProps {
  contentId: string;
  contentType: CONTENT_TYPE;
  userId: string;
  type: REACTION_TYPE;
}

export interface CreateReactionProps {
  contentId: string;
  contentType: CONTENT_TYPE;
  userId: string;
  type: REACTION_TYPE;
}

export interface ReconstituteReactionProps {
  id: UUID;
  contentId: string;
  contentType: CONTENT_TYPE;
  userId: string;
  type: REACTION_TYPE;
  createdAt: Date;
}

export class ReactionEntity extends AggregateRoot<ReactionProps> {
  // ============================================
  // Factory Methods
  // ============================================

  private constructor(props: ReactionProps, id?: UUID) {
    super(props, id);
  }

  static create(props: CreateReactionProps): ReactionEntity {
    const reaction = new ReactionEntity({
      contentId: props.contentId,
      contentType: props.contentType,
      userId: props.userId,
      type: props.type,
    });

    reaction.addDomainEvent(
      new ReactionCreatedEvent(reaction.id, props.contentId, props.contentType, props.userId, props.type),
    );

    return reaction;
  }

  static reconstitute(props: ReconstituteReactionProps): ReactionEntity {
    const reaction = new ReactionEntity(
      {
        contentId: props.contentId,
        contentType: props.contentType,
        userId: props.userId,
        type: props.type,
      },
      props.id,
    );
    reaction.setTimestamps(props.createdAt, props.createdAt);

    return reaction;
  }

  // ============================================
  // Getters
  // ============================================

  get contentId(): string {
    return this._props.contentId;
  }

  get contentType(): CONTENT_TYPE {
    return this._props.contentType;
  }

  get userId(): string {
    return this._props.userId;
  }

  get type(): REACTION_TYPE {
    return this._props.type;
  }

  // ============================================
  // Behavior Methods
  // ============================================

  changeType(newType: REACTION_TYPE): void {
    if (this._props.type === newType) {
      return;
    }

    const oldType = this._props.type;
    this._props.type = newType;
    this.markAsUpdated();

    this.addDomainEvent(
      new ReactionChangedEvent(this.id, this.contentId, this.contentType, this.userId, oldType, newType),
    );
  }

  remove(): void {
    this.addDomainEvent(
      new ReactionRemovedEvent(this.id, this.contentId, this.contentType, this.userId, this.type),
    );
  }
}
