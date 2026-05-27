export const USER_READ_REPO_TOKEN = Symbol('USER_READ_REPO_TOKEN');

export interface UserReadModel {
    _id: string;
    displayName: string;
    avatarUrl?: string;
}

export interface IUserReadRepository {
    findById(id: string): Promise<UserReadModel | null>;
    findManyByIds(ids: string[]): Promise<UserReadModel[]>;
}
