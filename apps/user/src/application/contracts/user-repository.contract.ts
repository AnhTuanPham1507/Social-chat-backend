import { UserEntity } from "@social-chat/domain";

export const USER_REPO_TOKEN = Symbol('USER_REPO_TOKEN');

export interface IUserRepository {
    insert(user: UserEntity): Promise<void>;
    update(user: UserEntity): Promise<void>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
    findAllPaginated(options: {
        page: number;
        limit: number;
        search?: string;
        excludeUserId?: string;
    }): Promise<{ data: UserEntity[]; total: number }>;
}
