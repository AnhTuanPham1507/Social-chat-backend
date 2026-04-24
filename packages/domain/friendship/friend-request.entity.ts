import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { FRIEND_REQUEST_STATUS } from './friendship-status.enum';
import { FriendRequestSentEvent } from './events/friend-request-sent.event';
import { FriendRequestAcceptedEvent } from './events/friend-request-accepted.event';
import { FriendRequestDeclinedEvent } from './events/friend-request-declined.event';

interface FriendRequestProps {
  senderId: string;
  receiverId: string;
  status: FRIEND_REQUEST_STATUS;
}

export interface CreateFriendRequestProps {
  senderId: string;
  receiverId: string;
}

export interface ReconstituteFriendRequestProps {
  id: UUID;
  senderId: string;
  receiverId: string;
  status: FRIEND_REQUEST_STATUS;
  createdAt: Date;
  updatedAt: Date;
}

export class FriendRequestEntity extends AggregateRoot<FriendRequestProps> {
  private constructor(props: FriendRequestProps, id?: UUID) {
    super(props, id);
  }

  static create(props: CreateFriendRequestProps): FriendRequestEntity {
    if (props.senderId === props.receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const entity = new FriendRequestEntity(
      {
        senderId: props.senderId,
        receiverId: props.receiverId,
        status: FRIEND_REQUEST_STATUS.PENDING,
      },
    );

    entity.addDomainEvent(
      new FriendRequestSentEvent(entity.id, props.senderId, props.receiverId),
    );

    return entity;
  }

  static reconstitute(props: ReconstituteFriendRequestProps): FriendRequestEntity {
    const entity = new FriendRequestEntity(
      {
        senderId: props.senderId,
        receiverId: props.receiverId,
        status: props.status,
      },
      props.id,
    );
    entity.setTimestamps(props.createdAt, props.updatedAt);
    return entity;
  }

  get senderId(): string {
    return this._props.senderId;
  }

  get receiverId(): string {
    return this._props.receiverId;
  }

  get status(): FRIEND_REQUEST_STATUS {
    return this._props.status;
  }

  accept(currentUserId: string): void {
    if (this._props.receiverId !== currentUserId) {
      throw new Error('Only the request recipient can accept');
    }
    if (this._props.status !== FRIEND_REQUEST_STATUS.PENDING) {
      throw new Error('Only pending requests can be accepted');
    }

    this._props.status = FRIEND_REQUEST_STATUS.ACCEPTED;
    this.addDomainEvent(
      new FriendRequestAcceptedEvent(this.id, this._props.senderId, this._props.receiverId),
    );
  }

  decline(currentUserId: string): void {
    if (this._props.receiverId !== currentUserId) {
      throw new Error('Only the request recipient can decline');
    }
    if (this._props.status !== FRIEND_REQUEST_STATUS.PENDING) {
      throw new Error('Only pending requests can be declined');
    }

    this._props.status = FRIEND_REQUEST_STATUS.DECLINED;
    this.addDomainEvent(
      new FriendRequestDeclinedEvent(this.id, this._props.senderId, this._props.receiverId),
    );
  }
}
