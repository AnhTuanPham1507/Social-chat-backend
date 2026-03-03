import { User } from '../dtos/user.dto';
import { ICreateUserProps, UserEntity } from '@social-chat/domain';

/**
 * Mapper for converting between UserEntity (domain) and User DTO (application).
 *
 * This mapper handles:
 * - Creating domain entities from input props (using factory methods)
 * - Converting domain entities to DTOs for API responses
 */
export class UserAppMapper {
  /**
   * Creates a new UserEntity from input props.
   * Uses the factory method pattern - delegates to UserEntity.create() or UserEntity.fromProps()
   *
   * @param userProps - Props for creating the user
   * @returns New UserEntity (with UserCreatedEvent in domainEvents)
   */
  static fromPropsToEntity(userProps: ICreateUserProps): UserEntity {
    // Use the deprecated fromProps for backward compatibility
    // This handles both new creation and reconstitution based on whether id/timestamps exist
    return UserEntity.fromProps(userProps);
  }

  /**
   * Converts a domain entity to a DTO for API responses.
   *
   * @param entity - The domain entity
   * @returns User DTO with primitive values
   */
  static fromEntityToAppModel(entity: UserEntity): User {
    return {
      id: entity.id,
      fullName: entity.fullName.value,
      email: entity.email.value,
      phone: entity.phone?.value,
      sex: entity.sex.value,
      avatarUrl: entity.avatarUrl?.value,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    };
  }
}
