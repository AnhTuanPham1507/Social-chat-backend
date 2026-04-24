import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { FRIENDSHIP_TYPE } from './friendship-type.enum';
import { FriendRemovedEvent } from './events/friend-removed.event';
import { UserBlockedEvent } from './events/user-blocked.event';
import { UserUnblockedEvent } from './events/user-unblocked.event';

interface FriendshipProps {
  userId: string;
  friendId: string;
  type: FRIENDSHIP_TYPE;
}

export interface CreateFriendshipProps {
  userId: string;
  friendId: string;
}

export interface CreateBlockProps {
  blockerId: string;
  blockedId: string;
}

export interface ReconstituteFriendshipProps {
  id: UUID;
  userId: string;
  friendId: string;
  type: FRIENDSHIP_TYPE;
  createdAt: Date;
}

export class FriendshipEntity extends AggregateRoot<FriendshipProps> {
  private constructor(props: FriendshipProps, id?: UUID) {
    super(props, id);
  }

  static create(props: CreateFriendshipProps): FriendshipEntity {
    if (props.userId === props.friendId) {
      throw new Error('Cannot create friendship with yourself');
    }

    return new FriendshipEntity({
      userId: props.userId,
      friendId: props.friendId,
      type: FRIENDSHIP_TYPE.FRIEND,
    });
  }

  static createBlock(props: CreateBlockProps): [blocker: FriendshipEntity, blocked: FriendshipEntity] {
    if (props.blockerId === props.blockedId) {
      throw new Error('Cannot block yourself');
    }

    const blockerRow = new FriendshipEntity({
      userId: props.blockerId,
      friendId: props.blockedId,
      type: FRIENDSHIP_TYPE.BLOCKED,
    });

    const blockedRow = new FriendshipEntity({
      userId: props.blockedId,
      friendId: props.blockerId,
      type: FRIENDSHIP_TYPE.BLOCKED_BY,
    });

    blockerRow.addDomainEvent(
      new UserBlockedEvent(blockerRow.id, props.blockerId, props.blockedId),
    );

    return [blockerRow, blockedRow];
  }

  static reconstitute(props: ReconstituteFriendshipProps): FriendshipEntity {
    const entity = new FriendshipEntity(
      {
        userId: props.userId,
        friendId: props.friendId,
        type: props.type,
      },
      props.id,
    );
    entity.setTimestamps(props.createdAt, props.createdAt);
    return entity;
  }

  get userId(): string {
    return this._props.userId;
  }

  get friendId(): string {
    return this._props.friendId;
  }

  get type(): FRIENDSHIP_TYPE {
    return this._props.type;
  }

  get isFriend(): boolean {
    return this._props.type === FRIENDSHIP_TYPE.FRIEND;
  }

  get isBlocked(): boolean {
    return this._props.type === FRIENDSHIP_TYPE.BLOCKED;
  }

  get isBlockedBy(): boolean {
    return this._props.type === FRIENDSHIP_TYPE.BLOCKED_BY;
  }

  remove(currentUserId: string): void {
    if (this._props.userId !== currentUserId && this._props.friendId !== currentUserId) {
      throw new Error('Only a participant of the friendship can remove it');
    }
    if (!this.isFriend) {
      throw new Error('Can only remove an active friendship');
    }

    this.addDomainEvent(
      new FriendRemovedEvent(
        this.id,
        this._props.userId,
        this._props.friendId,
        currentUserId,
      ),
    );
  }

  unblock(currentUserId: string): void {
    if (this._props.userId !== currentUserId) {
      throw new Error('Only the blocker can unblock');
    }
    if (!this.isBlocked) {
      throw new Error('Can only unblock a blocked user');
    }

    this.addDomainEvent(
      new UserUnblockedEvent(this.id, this._props.userId, this._props.friendId),
    );
  }
}
