export const USER_READ_REPO_TOKEN = Symbol('USER_READ_REPO_TOKEN');

export interface UpsertUserData {
    displayName: string;
    avatarUrl?: string;
}

export interface IUserReadRepository {
    upsertUser(id: string, data: UpsertUserData): Promise<void>;
    deleteUser(id: string): Promise<void>;
}
