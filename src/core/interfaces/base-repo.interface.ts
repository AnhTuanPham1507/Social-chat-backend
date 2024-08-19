import { UserEntity } from '../entities/user.entity';

export interface IRepo<T> {
    exists(
        t: T,
        fieldNames: string[],
    ): Promise<{ isExisted: boolean; duplicatedFieldName: string | null }>;
    save(t: T): Promise<T>;
}

export interface IUserRepo extends IRepo<UserEntity> {}
