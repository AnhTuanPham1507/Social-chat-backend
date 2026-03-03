
import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import { UserPersistenceMapper } from './mappers/user-persistence.mapper';
import { IUserRepository } from '@application/contracts/user-repository.contract';
import { BaseUserRepository, REDIS_SERVICE_TOKEN, RedisBaseService, SharedStoreKeyHelper, UserModel } from '@social-chat/infrastructure';
import { UserEntity } from '@social-chat/domain';

@Injectable()
export class UserRepo implements IUserRepository {
    constructor(
        private _userRepo: BaseUserRepository,
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redisService: RedisBaseService,
    ) {}

    public async insert(user: UserEntity): Promise<void> {
         const userModel = UserPersistenceMapper.fromEntityToModel(user);
        const createdUser = await this._userRepo.create(userModel);

        if (!createdUser) {
            throw new InternalServerErrorException("Can't create user");
        }

        const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(createdUser.id);
        await this._redisService.hset(userInfoKey, createdUser);
    }

    public async findById(id: string): Promise<UserEntity | null> {
        const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(id);
        const cached = await this._redisService.hgetall<Record<string, unknown>>(userInfoKey);
        const userModel: UserModel = cached
            ? (cached as unknown as UserModel)
            : await this._userRepo.findOne({ id });

        return userModel ? UserPersistenceMapper.fromModelToEntity(userModel) : null;
    }

    public async findByEmail(email: string): Promise<UserEntity | null> {
        const userModel = await this._userRepo.findOne({ email });

        return userModel ? UserPersistenceMapper.fromModelToEntity(userModel) : null;
    }
}
