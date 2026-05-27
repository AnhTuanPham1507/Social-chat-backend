import { Injectable } from '@nestjs/common';

import { UserReadMongoRepository } from '@social-chat/infrastructure';

import {
    IUserReadRepository,
    UpsertUserData,
} from '../../application/contracts/user-read-repository.contract';

@Injectable()
export class UserReadRepo implements IUserReadRepository {
    constructor(
        private readonly _userReadMongoRepo: UserReadMongoRepository,
    ) {}

    async upsertUser(id: string, data: UpsertUserData): Promise<void> {
        await this._userReadMongoRepo.upsert(id, data as any);
    }

    async deleteUser(id: string): Promise<void> {
        await this._userReadMongoRepo.deleteById(id);
    }
}
