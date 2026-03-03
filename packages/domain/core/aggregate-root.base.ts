import { randomUUID } from 'crypto';
import { DomainEvent } from './domain-event.base';

export type UUID = string;

export interface AggregateProps<TProps> {
  id?: UUID;
  props: TProps;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Base class for aggregate roots in DDD.
 *
 * An aggregate root is the main entity that controls access to a cluster of associated objects.
 * It ensures consistency within the aggregate boundary and collects domain events
 * that should be published after the aggregate is persisted.
 *
 * Key responsibilities:
 * - Maintains aggregate invariants
 * - Collects domain events for later publishing
 * - Provides factory methods for creation and reconstitution
 *
 * @example
 * ```typescript
 * interface UserProps {
 *   email: EmailVO;
 *   displayName: string;
 * }
 *
 * export class UserAggregate extends AggregateRoot<UserProps> {
 *   private constructor(props: UserProps, id?: UUID) {
 *     super(props, id);
 *   }
 *
 *   static create(props: Omit<UserProps, 'createdAt' | 'updatedAt'>): UserAggregate {
 *     const user = new UserAggregate(props);
 *     user.addDomainEvent(new UserCreatedEvent(user.id, props.email.value));
 *     return user;
 *   }
 *
 *   static reconstitute(props: UserProps, id: UUID): UserAggregate {
 *     return new UserAggregate(props, id);
 *   }
 * }
 * ```
 */
export abstract class AggregateRoot<TProps> {
  protected readonly _id: UUID;
  protected _props: TProps;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _deletedAt?: Date;
  private _domainEvents: DomainEvent[] = [];

  /**
   * Protected constructor - use factory methods (create/reconstitute) instead.
   *
   * @param props - The aggregate properties
   * @param id - Optional ID (will be generated if not provided)
   */
  protected constructor(props: TProps, id?: UUID) {
    this._id = id ?? randomUUID();
    this._props = props;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // ============================================
  // Getters
  // ============================================

  get id(): UUID {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  // ============================================
  // Domain Events
  // ============================================

  /**
   * Returns a readonly array of domain events collected by this aggregate.
   */
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  /**
   * Adds a domain event to be published after persistence.
   * Should be called from within aggregate methods that change state.
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clears all domain events.
   * Should be called after events have been published.
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // ============================================
  // Lifecycle Methods
  // ============================================

  /**
   * Marks the aggregate as updated.
   * Should be called from within methods that modify state.
   */
  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  /**
   * Soft deletes the aggregate.
   */
  protected markAsDeleted(): void {
    this._deletedAt = new Date();
    this.markAsUpdated();
  }

  /**
   * Restores a soft-deleted aggregate.
   */
  protected restore(): void {
    this._deletedAt = undefined;
    this.markAsUpdated();
  }

  // ============================================
  // Reconstitution Support
  // ============================================

  /**
   * Sets the timestamps when reconstituting from persistence.
   * Should only be called from the reconstitute factory method.
   */
  protected setTimestamps(createdAt: Date, updatedAt: Date, deletedAt?: Date): void {
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._deletedAt = deletedAt;
  }

  // ============================================
  // Equality
  // ============================================

  /**
   * Two aggregates are equal if they have the same ID.
   */
  equals(other: AggregateRoot<TProps>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof AggregateRoot)) {
      return false;
    }
    return this._id === other._id;
  }
}
