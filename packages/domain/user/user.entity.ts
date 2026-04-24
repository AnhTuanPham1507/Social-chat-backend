import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { Email } from '../common/email.value-object';
import { UserAvatarUrl } from './user-avatar.value-object';
import { UserPhone } from './user-phone.value-object';
import { USER_SEX, UserSex } from './user-sex.value-object';
import { UserFullName } from './user-full-name.value-object';
import { UserCreatedEvent } from './events/user-created.event';
import { UserProfileUpdatedEvent } from './events/user-profile-updated.event';

/**
 * Internal props for the User aggregate.
 * Uses value objects for validated types.
 */
interface UserProps {
  email: Email;
  fullName: UserFullName;
  avatarUrl: UserAvatarUrl;
  phone: UserPhone;
  sex: UserSex;
  interests: string[];
  hasCompletedOnboarding: boolean;
}

/**
 * Props for creating a new user.
 * Uses primitive types that will be converted to value objects.
 */
export interface CreateUserProps {
  id?: UUID;
  email: string;
  fullName: string;
  sex?: USER_SEX;
  phone?: string;
  avatarUrl?: string;
  interests?: string[];
}

/**
 * Props for reconstituting a user from persistence.
 * Includes all stored data including timestamps.
 */
export interface ReconstituteUserProps {
  id: UUID;
  email: string;
  fullName: string;
  sex: USER_SEX;
  phone?: string;
  avatarUrl?: string;
  interests?: string[];
  hasCompletedOnboarding: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * @deprecated Use CreateUserProps instead. Kept for backward compatibility.
 */
export interface ICreateUserProps {
  id?: UUID;
  email: string;
  fullName: string;
  sex?: USER_SEX;
  phone?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * User Aggregate Root
 *
 * Represents a user in the social platform.
 * Manages user profile data and emits domain events on state changes.
 *
 * @example
 * ```typescript
 * // Creating a new user
 * const user = UserEntity.create({
 *   email: 'john@example.com',
 *   fullName: 'John Doe',
 *   sex: USER_SEX.MALE,
 * });
 *
 * // User now has UserCreatedEvent in domainEvents
 * console.log(user.domainEvents.length); // 1
 *
 * // Updating profile
 * user.updateFullName('John Smith');
 * // Now has UserCreatedEvent + UserProfileUpdatedEvent
 * ```
 */
export class UserEntity extends AggregateRoot<UserProps> {
  // ============================================
  // Factory Methods
  // ============================================

  /**
   * Private constructor - use factory methods instead.
   */
  private constructor(props: UserProps, id?: UUID) {
    super(props, id);
  }

  /**
   * Creates a new user aggregate.
   * Validates input and emits UserCreatedEvent.
   *
   * @param props - Primitive props for creating the user
   * @returns New UserEntity with UserCreatedEvent
   */
  static create(props: CreateUserProps): UserEntity {
    // Create value objects
    const userProps: UserProps = {
      email: Email.fromString(props.email.toLowerCase().trim()),
      fullName: UserFullName.fromString(props.fullName),
      sex: UserSex.fromString(props.sex),
      phone: UserPhone.fromString(props.phone),
      avatarUrl: UserAvatarUrl.fromString(props.avatarUrl),
      interests: props.interests ?? [],
      hasCompletedOnboarding: false,
    };

    const user = new UserEntity(userProps, props.id);

    // Emit domain event
    user.addDomainEvent(
      new UserCreatedEvent(user.id, user.email.value, user.fullName.value),
    );

    return user;
  }

  /**
   * Reconstitutes a user from persistence.
   * Does not emit events (used when loading from DB).
   *
   * @param props - All props including timestamps from persistence
   * @returns Reconstituted UserEntity without events
   */
  static reconstitute(props: ReconstituteUserProps): UserEntity {
    const userProps: UserProps = {
      email: Email.fromString(props.email),
      fullName: UserFullName.fromString(props.fullName),
      sex: UserSex.fromString(props.sex),
      phone: UserPhone.fromString(props.phone),
      avatarUrl: UserAvatarUrl.fromString(props.avatarUrl),
      interests: props.interests ?? [],
      hasCompletedOnboarding: props.hasCompletedOnboarding,
    };

    const user = new UserEntity(userProps, props.id);
    user.setTimestamps(props.createdAt, props.updatedAt, props.deletedAt);

    return user;
  }

  /**
   * @deprecated Use create() or reconstitute() instead.
   * Kept for backward compatibility with existing mappers.
   */
  static fromProps(props: ICreateUserProps): UserEntity {
    if (props.id && props.createdAt && props.updatedAt) {
      // Reconstituting from persistence
      return UserEntity.reconstitute({
        id: props.id,
        email: props.email,
        fullName: props.fullName,
        sex: props.sex ?? USER_SEX.UNKNOWN,
        phone: props.phone,
        avatarUrl: props.avatarUrl,
        hasCompletedOnboarding: false,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      });
    } else {
      // Creating new user
      return UserEntity.create({
        email: props.email,
        fullName: props.fullName,
        sex: props.sex,
        phone: props.phone,
        avatarUrl: props.avatarUrl,
      });
    }
  }

  // ============================================
  // Getters (Read-only access to props)
  // ============================================

  get email(): Email {
    return this._props.email;
  }

  get fullName(): UserFullName {
    return this._props.fullName;
  }

  get avatarUrl(): UserAvatarUrl {
    return this._props.avatarUrl;
  }

  get phone(): UserPhone {
    return this._props.phone;
  }

  get sex(): UserSex {
    return this._props.sex;
  }

  get interests(): string[] {
    return this._props.interests;
  }

  get hasCompletedOnboarding(): boolean {
    return this._props.hasCompletedOnboarding;
  }

  // ============================================
  // Behavior Methods (Business Logic)
  // ============================================

  /**
   * Updates the user's full name.
   * Validates the new name and emits UserProfileUpdatedEvent.
   *
   * @param newName - The new full name
   * @throws Error if name is invalid
   */
  updateFullName(newName: string): void {
    const newFullName = UserFullName.fromString(newName);

    if (newFullName.value === this._props.fullName.value) {
      return; // No change
    }

    this._props.fullName = newFullName;
    this.markAsUpdated();
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id, ['fullName']));
  }

  /**
   * Updates the user's avatar URL.
   * Emits UserProfileUpdatedEvent.
   *
   * @param newAvatarUrl - The new avatar URL or undefined to remove
   */
  updateAvatar(newAvatarUrl?: string): void {
    this._props.avatarUrl = UserAvatarUrl.fromString(newAvatarUrl);
    this.markAsUpdated();
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id, ['avatarUrl']));
  }

  /**
   * Updates the user's phone number.
   * Emits UserProfileUpdatedEvent.
   *
   * @param newPhone - The new phone number or undefined to remove
   */
  updatePhone(newPhone?: string): void {
    this._props.phone = UserPhone.fromString(newPhone);
    this.markAsUpdated();
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id, ['phone']));
  }

  /**
   * Updates the user's sex.
   * Emits UserProfileUpdatedEvent.
   *
   * @param newSex - The new sex value
   */
  updateSex(newSex: USER_SEX): void {
    if (this._props.sex.value === newSex) {
      return; // No change
    }

    this._props.sex = UserSex.fromString(newSex);
    this.markAsUpdated();
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id, ['sex']));
  }

  /**
   * Updates multiple profile fields at once.
   * Only emits a single UserProfileUpdatedEvent with all changed fields.
   *
   * @param updates - Object with fields to update
   */
  /**
   * Marks onboarding as completed. One-way transition.
   */
  completeOnboarding(): void {
    if (this._props.hasCompletedOnboarding) return;
    this._props.hasCompletedOnboarding = true;
    this.markAsUpdated();
  }

  updateInterests(interests: string[]): void {
    const normalized = interests.map((i) => i.toLowerCase().trim());
    const current = this._props.interests;

    if (
      normalized.length === current.length &&
      normalized.every((v, i) => v === current[i])
    ) {
      return;
    }

    this._props.interests = normalized;
    this.markAsUpdated();
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id, ['interests']));
  }

  updateProfile(updates: {
    fullName?: string;
    avatarUrl?: string;
    phone?: string;
    sex?: USER_SEX;
    interests?: string[];
  }): void {
    const changedFields: string[] = [];

    if (updates.fullName !== undefined) {
      const newFullName = UserFullName.fromString(updates.fullName);
      if (newFullName.value !== this._props.fullName.value) {
        this._props.fullName = newFullName;
        changedFields.push('fullName');
      }
    }

    if (updates.avatarUrl !== undefined) {
      this._props.avatarUrl = UserAvatarUrl.fromString(updates.avatarUrl);
      changedFields.push('avatarUrl');
    }

    if (updates.phone !== undefined) {
      this._props.phone = UserPhone.fromString(updates.phone);
      changedFields.push('phone');
    }

    if (updates.sex !== undefined && this._props.sex.value !== updates.sex) {
      this._props.sex = UserSex.fromString(updates.sex);
      changedFields.push('sex');
    }

    if (updates.interests !== undefined) {
      const normalized = updates.interests.map((i) => i.toLowerCase().trim());
      this._props.interests = normalized;
      changedFields.push('interests');

      // First time setting interests = onboarding complete
      if (!this._props.hasCompletedOnboarding && normalized.length > 0) {
        this._props.hasCompletedOnboarding = true;
        changedFields.push('hasCompletedOnboarding');
      }
    }

    if (changedFields.length > 0) {
      this.markAsUpdated();
      this.addDomainEvent(new UserProfileUpdatedEvent(this.id, changedFields));
    }
  }

  /**
   * Soft deletes the user account.
   */
  deactivate(): void {
    if (this.isDeleted) {
      return; // Already deleted
    }
    this.markAsDeleted();
    // Could emit UserDeactivatedEvent here
  }

  /**
   * Restores a deactivated user account.
   */
  reactivate(): void {
    if (!this.isDeleted) {
      return; // Not deleted
    }
    this.restore();
    // Could emit UserReactivatedEvent here
  }
}
