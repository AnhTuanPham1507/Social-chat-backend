import { BaseUserRepository } from '@infras/database/repos/user.repository';
import { IUserRepository } from '@modules/auth/application/contracts/user-repository.contract';
import { UserEntity } from '@modules/auth/domain/entities/user/user.entity';
import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import { USER_MAPPER_TOKEN, IUserMapper } from '../../application/mappers';

@Injectable()
export class UserRepo implements IUserRepository {
    constructor(
        private _userRepo: BaseUserRepository,
        @Inject(USER_MAPPER_TOKEN)
        private readonly _userMapper: IUserMapper,
    ) {}

    public async insert(user: UserEntity): Promise<void> {
        const userModel = this._userMapper.fromEntityToModel(user);
        const createdUser = await this._userRepo.create(userModel);

        if (!createdUser) {
            throw new InternalServerErrorException("Can't create user");
        }
    }
}
