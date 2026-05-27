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

/**
 * Read-side user projection owned by the messaging bounded context.
 *
 * Populated via CDC from the auth/user PostgreSQL source. The collection
 * is a messaging-local copy (`messaging_users`) — NOT shared with feed —
 * so the messaging schema can evolve independently of other contexts.
 */
export interface IUserReadRepository {
    upsertUser(id: string, data: UpsertUserData): Promise<void>;
    deleteUser(id: string): Promise<void>;
    findById(id: string): Promise<UserReadModel | null>;
    /**
     * Batch lookup. Used by the inbox list to attach participant
     * snapshots to each conversation in one round-trip. Missing ids are
     * simply omitted from the result (CDC eventual consistency).
     */
    findManyByIds(ids: string[]): Promise<UserReadModel[]>;
}
