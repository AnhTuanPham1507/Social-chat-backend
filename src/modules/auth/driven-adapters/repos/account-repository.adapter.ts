import { PostgresAccountRepository } from '@infras/postgres/repositories/account.repository';
import { IAccountRepository } from '@modules/auth/application/contracts/account-repository.contract';
import { AccountEntity } from '@modules/auth/domain/entities/account/account.entity';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class AccountRepo implements IAccountRepository {
    constructor(private _accountRepo: PostgresAccountRepository) {}

    async findOne(query: object): Promise<AccountEntity | null> {
        const foundAccount = await this._accountRepo.findOne(query);

        return foundAccount ? AccountEntity.fromRaw(foundAccount) : null;
    }

    async insert(account: AccountEntity): Promise<void> {
        const createdAccount = await this._accountRepo.insert({
            ...account.toObject(),
        });

        if (!createdAccount) {
            throw new InternalServerErrorException("Can't create account");
        }
    }
}
