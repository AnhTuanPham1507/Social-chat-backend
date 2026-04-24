export const USER_READ_REPO_TOKEN = Symbol('USER_READ_REPO_TOKEN');

export interface UserReadModel {
    _id: string;
    displayName: string;
    avatarUrl?: string;
}

export interface UpsertUserData {
    displayName: string;
    avatarUrl?: string;
}

export interface IUserReadRepository {
    upsertUser(id: string, data: UpsertUserData): Promise<void>;
    findById(id: string): Promise<UserReadModel | null>;
    deleteUser(id: string): Promise<void>;
}
