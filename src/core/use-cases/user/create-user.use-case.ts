import CreateUserDTO from 'src/core/dtos/create-user.dto';
import UserDTO from 'src/core/dtos/user.dto';
import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from 'src/core/entities/user.entity';
import { generateHash } from 'src/core/helpers/hash.helper';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { IUseCase } from 'src/core/interfaces/base-use-case.interface';
import { IUserRepo } from 'src/core/interfaces/base-repo.interface';

export interface ICreateUserUseCase extends IUseCase<CreateUserDTO, UserDTO> {}

@Injectable()
export class CreateUserUseCase implements ICreateUserUseCase {
    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,
    ) {}

    async execute(payload: CreateUserDTO): Promise<UserDTO> {
        const userEntity = new UserEntity(
            payload.fullName,
            payload.email,
            payload.phone,
            payload.password,
            payload.sex,
        );

        const { isExisted, duplicatedFieldName } = await this.userRepo.exists(
            userEntity,
            ['email', 'phone'],
        );
        if (isExisted) {
            throw new Error(`${duplicatedFieldName} is already exists`);
        }

        userEntity.password = generateHash(userEntity.password);

        await this.userRepo.save(userEntity);

        return new UserDTO(userEntity);
    }
}
