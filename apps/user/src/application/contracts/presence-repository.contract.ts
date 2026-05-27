export const PRESENCE_READ_REPO_TOKEN = Symbol('PRESENCE_READ_REPO_TOKEN');

export interface UserPresenceResult {
    userId: string;
    status: boolean;
    lastSeenAt: Date | null;
}

export interface IPresenceReadRepository {
    getBatch(userIds: string[]): Promise<UserPresenceResult[]>;
}
