import { UserEntity } from "@social-chat/domain";

export const USER_REPO_TOKEN = Symbol('USER_REPO_TOKEN');

export interface SearchHit {
    user: UserEntity;
    score: number;
}

export interface AutocompleteHit {
    id: string;
    fullName: string;
}

export interface IUserRepository {
    insert(user: UserEntity): Promise<void>;
    update(user: UserEntity): Promise<void>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
    findByIds(ids: string[]): Promise<UserEntity[]>;
    findAllPaginated(options: {
        page: number;
        limit: number;
        search?: string;
        excludeUserId?: string;
    }): Promise<{ data: UserEntity[]; total: number }>;

    /**
     * Full-text-ish search by full name with trigram similarity ranking.
     * Returns hits with similarity score for app-side re-ranking (e.g., mutual friends).
     */
    searchByName(
        query: string,
        options: {
            limit: number;
            offset?: number;
            excludeUserId?: string;
        },
    ): Promise<{ items: SearchHit[]; total: number }>;

    /**
     * Token-prefix autocomplete (matches names where any word starts with the query).
     */
    autocompleteByName(
        query: string,
        options: {
            limit: number;
            excludeUserId?: string;
        },
    ): Promise<AutocompleteHit[]>;
}
