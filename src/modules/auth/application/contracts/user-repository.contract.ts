import { UserEntity } from '@modules/auth/domain/entities/user/user.entity';

export const USER_REPO_TOKEN = Symbol('USER_REPO_TOKEN');

export interface IUserRepository {
    insert(user: UserEntity): Promise<void>;
}
