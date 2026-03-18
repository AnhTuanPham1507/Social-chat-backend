import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileInput, User } from '../dtos/user.dto';
import { IUserRepository, USER_REPO_TOKEN } from '../contracts/user-repository.contract';
import { UserAppMapper } from '../mappers/user-app.mapper';
import { UserEventPublisherAdapter } from '../../driven-adapters/event-publisher/user-event-publisher.adapter';


export const USER_APPLICATION_SERVICE_TOKEN = Symbol('USER_APPLICATION_SERVICE_TOKEN');
export interface IUserApplicationService {
    getUserProfile(email: string): Promise<User>;
    updateUserProfile(email: string, input: UpdateProfileInput): Promise<User>;
}

@Injectable()
export class UserApplicationService implements IUserApplicationService {
    constructor(
        @Inject(USER_REPO_TOKEN)
        private readonly _userRepo: IUserRepository,
        private readonly _userEventPublisher: UserEventPublisherAdapter,
    ) {}

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
        await this._userEventPublisher.publishAll(events);

        return UserAppMapper.fromEntityToAppModel(userEntity);
    }
}
