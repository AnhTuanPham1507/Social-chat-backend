import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserInput, UpdateProfileInput, User } from '../dtos/user.dto';
import { IUserRepository, USER_REPO_TOKEN } from '../contracts/user-repository.contract';
import { UserAppMapper } from '../mappers/user-app.mapper';
import { DOMAIN_EVENT_BUS_TOKEN, IDomainEventBus, UserEntity } from '@social-chat/domain';


export interface GetAllUsersInput {
    page: number;
    limit: number;
    search?: string;
    currentUserId: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export const USER_APPLICATION_SERVICE_TOKEN = Symbol('USER_APPLICATION_SERVICE_TOKEN');
export interface IUserApplicationService {
    createUser(input: CreateUserInput): Promise<User>;
    getUserProfile(email: string): Promise<User>;
    updateUserProfile(email: string, input: UpdateProfileInput): Promise<User>;
    getAllUsers(input: GetAllUsersInput): Promise<PaginatedResult<User>>;
}

@Injectable()
export class UserApplicationService implements IUserApplicationService {
    private readonly logger = new Logger(UserApplicationService.name);

    constructor(
        @Inject(USER_REPO_TOKEN)
        private readonly _userRepo: IUserRepository,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
    ) {}

    public async createUser(input: CreateUserInput): Promise<User> {
        const existingUser = await this._userRepo.findByEmail(input.email);

        if (existingUser) {
            this.logger.debug(`User already exists with email: ${input.email}`);
            return UserAppMapper.fromEntityToAppModel(existingUser);
        }

        const userEntity = UserEntity.create({
            id: input.id,
            email: input.email,
            fullName: input.fullName,
        });

        await this._userRepo.insert(userEntity);

        const events = userEntity.publishEvents();
        await this._domainEventBus.publishAll(events);

        this.logger.log(`Created new user with email: ${input.email}, id: ${userEntity.id}`);

        return UserAppMapper.fromEntityToAppModel(userEntity);
    }

    public async getUserProfile(email: string): Promise<User> {
        const userEntity = await this._userRepo.findByEmail(email);

        if (!userEntity) {
            throw new NotFoundException('User not found');
        }

        return UserAppMapper.fromEntityToAppModel(userEntity);
    }

    public async updateUserProfile(email: string, input: UpdateProfileInput): Promise<User> {
        const userEntity = await this._userRepo.findByEmail(email);

        if (!userEntity) {
            throw new NotFoundException('User not found');
        }

        userEntity.updateProfile(input);
        await this._userRepo.update(userEntity);

        const events = userEntity.publishEvents();
        await this._domainEventBus.publishAll(events);

        return UserAppMapper.fromEntityToAppModel(userEntity);
    }

    public async getAllUsers(input: GetAllUsersInput): Promise<PaginatedResult<User>> {
        const { data, total } = await this._userRepo.findAllPaginated({
            page: input.page,
            limit: input.limit,
            search: input.search,
            excludeUserId: input.currentUserId,
        });

        return {
            data: data.map(UserAppMapper.fromEntityToAppModel),
            total,
            page: input.page,
            limit: input.limit,
        };
    }
}
