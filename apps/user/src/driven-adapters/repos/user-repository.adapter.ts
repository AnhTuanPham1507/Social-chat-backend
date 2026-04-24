import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import { UserPersistenceMapper } from './mappers/user-persistence.mapper';
import { BaseUserRepository, REDIS_SERVICE_TOKEN, RedisBaseService, SharedStoreKeyHelper, UserModel } from '@social-chat/infrastructure';
import { UserEntity } from '@social-chat/domain';
import { IUserRepository } from '@application/contracts/user-repository.contract';

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
        const cached = await this._redisService.hgetall(userInfoKey);

        const userModel: UserModel = cached
            ? (cached as unknown as UserModel)
            : await this._userRepo.findOne({ id });

        return userModel ? UserPersistenceMapper.fromModelToEntity(userModel) : null;
    }

    public async findByEmail(email: string): Promise<UserEntity | null> {
        const userModel = await this._userRepo.findOne({ email });

        return userModel ? UserPersistenceMapper.fromModelToEntity(userModel) : null;
    }

    public async update(user: UserEntity): Promise<void> {
        const userModel = UserPersistenceMapper.fromEntityToModel(user);
        await this._userRepo.update(user.id, userModel);

        // Update cache
        const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(user.id);
        await this._redisService.hset(userInfoKey, userModel);
    }

    public async findAllPaginated(options: {
        page: number;
        limit: number;
        search?: string;
        excludeUserId?: string;
    }): Promise<{ data: UserEntity[]; total: number }> {
        const { page, limit, search, excludeUserId } = options;
        const skip = (page - 1) * limit;

        const qb = this._userRepo
            .getRepository()
            .createQueryBuilder('u')
            .where('u.deleted_at IS NULL');

        if (excludeUserId) {
            qb.andWhere('u.id != :excludeUserId', { excludeUserId });
        }

        if (search) {
            qb.andWhere('u.full_name ILIKE :search', { search: `%${search}%` });
        }

        qb.orderBy('u.full_name', 'ASC');

        const total = await qb.getCount();
        const models = await qb.skip(skip).take(limit).getMany();

        const entities = models.map((model) =>
            UserPersistenceMapper.fromModelToEntity(model),
        );

        return { data: entities, total };
    }
}
