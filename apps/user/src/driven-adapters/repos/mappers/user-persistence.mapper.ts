import { UserEntity, USER_SEX } from '@social-chat/domain';
import { UserModel } from '@social-chat/infrastructure';

/**
 * Mapper for converting between UserEntity (domain) and UserModel (persistence).
 *
 * Follows the mapper pattern to keep domain entities decoupled from ORM models.
 */
export class UserPersistenceMapper {
  /**
   * Converts a domain entity to a persistence model.
   * Used when saving to database.
   */
  static fromEntityToModel(entity: UserEntity): Partial<UserModel> {
    return {
      id: entity.id,
      fullName: entity.fullName.value,
      email: entity.email.value,
      phone: entity.phone?.value,
      sex: entity.sex.value,
      avatarUrl: entity.avatarUrl?.value,
      interests: entity.interests,
      hasCompletedOnboarding: entity.hasCompletedOnboarding,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }

  /**
   * Reconstitutes a domain entity from a persistence model.
   * Used when loading from database.
   */
  static fromModelToEntity(model: UserModel): UserEntity {
    return UserEntity.reconstitute({
      id: model.id,
      fullName: model.fullName,
      email: model.email,
      phone: model.phone,
      sex: model.sex as USER_SEX,
      avatarUrl: model.avatarUrl,
      interests: model.interests,
      hasCompletedOnboarding: model.hasCompletedOnboarding,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt || undefined,
    });
  }
}
