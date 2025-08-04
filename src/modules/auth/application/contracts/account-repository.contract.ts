import { AccountEntity } from '@modules/auth/domain/entities/account/account.entity';

export const ACCOUNT_REPO_TOKEN = Symbol('ACCOUNT_REPO_TOKEN');

export interface IAccountRepository {
    findOne(query: object): Promise<AccountEntity | null>;
    insert(account: AccountEntity): Promise<void>;
}
