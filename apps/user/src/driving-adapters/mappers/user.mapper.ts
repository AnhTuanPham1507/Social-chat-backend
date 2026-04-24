import { User } from "@application/dtos/user.dto";
import { UserDTO } from "../dtos/user.dto";

export class UserMapper {
    static fromAppModelToDTO(user: User): UserDTO {
        const dto = new UserDTO();
        dto.id = user.id;
        dto.fullName = user.fullName;
        dto.email = user.email;
        dto.phone = user.phone;
        dto.sex = user.sex;
        dto.avatarUrl = user.avatarUrl;
        dto.interests = user.interests;
        dto.hasCompletedOnboarding = user.hasCompletedOnboarding;
        dto.createdAt = user.createdAt;
        dto.updatedAt = user.updatedAt;
        dto.deletedAt = user.deletedAt;

        return dto;
    }
}