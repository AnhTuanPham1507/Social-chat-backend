import { Injectable } from '@nestjs/common';

import { MessagingUserReadMongoRepository } from '@social-chat/infrastructure';

import {
    IUserReadRepository,
    UpsertUserData,
    UserReadModel,
} from '../../application/contracts/user-read-repository.contract';

@Injectable()
export class UserReadRepo implements IUserReadRepository {
    constructor(
        private readonly _userReadMongoRepo: MessagingUserReadMongoRepository,
    ) {}

    async upsertUser(id: string, data: UpsertUserData): Promise<void> {
        await this._userReadMongoRepo.upsert(id, data as any);
    }

    async deleteUser(id: string): Promise<void> {
        await this._userReadMongoRepo.deleteById(id);
    }

    async findById(id: string): Promise<UserReadModel | null> {
        return this._userReadMongoRepo.findById(id) as Promise<UserReadModel | null>;
    }

    async findManyByIds(ids: string[]): Promise<UserReadModel[]> {
        if (ids.length === 0) return [];
        return this._userReadMongoRepo.findMany({ _id: { $in: ids } }) as Promise<
            UserReadModel[]
        >;
    }
}
