export const USER_SERVICE_TOKEN = Symbol('USER_SERVICE_TOKEN');

export interface UserServiceResult {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    phone?: string;
}

export interface IUserService {
    createUser(id: string, email: string, fullName: string): Promise<UserServiceResult>;
}
