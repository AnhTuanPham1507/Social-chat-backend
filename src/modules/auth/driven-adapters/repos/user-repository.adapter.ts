import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PostgresUserRepository } from '@infras/postgres/repositories/user.repository';
import { IUserRepository } from '@modules/auth/application/contracts/user-repository.contract';
import { UserEntity } from '@modules/auth/domain/entities/user/user.entity';

@Injectable()
export class UserRepo  implements IUserRepository {
    constructor(
        private _userRepo: PostgresUserRepository,
    ) {}

    async insert(user: UserEntity): Promise<void> {    
        const createdUser = await this._userRepo.insert({
           ...user.toObject(),
        });

        if(!createdUser) {
            throw new InternalServerErrorException("Can't create user");
        }
    }
}
