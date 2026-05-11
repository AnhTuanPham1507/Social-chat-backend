import { Inject, Injectable } from '@nestjs/common';
import {
    USER_REPO_TOKEN,
    IUserRepository,
    SearchHit,
} from '../contracts/user-repository.contract';
import {
    FRIENDSHIP_REPO_TOKEN,
    IFriendshipRepository,
} from '../contracts/friendship-repository.contract';
import { UserAppMapper } from '../mappers/user-app.mapper';
import { User } from '../dtos/user.dto';

export const USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN = Symbol(
    'USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN',
);

export interface SearchUsersResult {
    items: User[];
    total: number;
    nextSearchAfter: (string | number)[] | null;
    hasMore: boolean;
}

export interface UserAutocompleteResult {
    id: string;
    fullName: string;
    highlight?: string;
}

export interface IUserSearchQueryApplicationService {
    searchUsers(
        currentUserId: string,
        query: string,
        size?: number,
        searchAfter?: (string | number)[],
    ): Promise<SearchUsersResult>;

    autocomplete(
        currentUserId: string,
        query: string,
        size?: number,
    ): Promise<UserAutocompleteResult[]>;
}

/**
 * Bucket precision for the score-tie heuristic.
 * Two trigram similarity scores within 0.01 are treated as tied — the
 * mutual-friends signal then breaks the tie.
 */
const SCORE_BUCKET_DECIMALS = 2;

@Injectable()
export class UserSearchQueryApplicationService
    implements IUserSearchQueryApplicationService
{
    constructor(
        @Inject(USER_REPO_TOKEN)
        private readonly _userRepo: IUserRepository,
        @Inject(FRIENDSHIP_REPO_TOKEN)
        private readonly _friendshipRepo: IFriendshipRepository,
    ) {}

    async searchUsers(
        currentUserId: string,
        query: string,
        size: number = 20,
        searchAfter?: (string | number)[],
    ): Promise<SearchUsersResult> {
        const offset = this._decodeOffset(searchAfter);

        const { items: hits, total } = await this._userRepo.searchByName(query, {
            limit: size,
            offset,
            excludeUserId: currentUserId,
        });

        if (hits.length === 0) {
            return { items: [], total, nextSearchAfter: null, hasMore: false };
        }

        // Tiebreaker: when scores bucket-equal, prefer users with more mutual friends.
        const ids = hits.map((h) => h.user.id);
        const mutualCounts = await this._friendshipRepo.getMutualFriendsCountsFor(
            currentUserId,
            ids,
        );
        const reranked = this._rerankByMutualFriends(hits, mutualCounts);

        const items = reranked.map((h) => UserAppMapper.fromEntityToAppModel(h.user));

        const hasMore = offset + hits.length < total;
        const nextSearchAfter = hasMore ? [offset + hits.length] : null;

        return { items, total, nextSearchAfter, hasMore };
    }

    async autocomplete(
        currentUserId: string,
        query: string,
        size: number = 8,
    ): Promise<UserAutocompleteResult[]> {
        const hits = await this._userRepo.autocompleteByName(query, {
            limit: size,
            excludeUserId: currentUserId,
        });

        return hits.map((h) => ({
            id: h.id,
            fullName: h.fullName,
            highlight: this._buildHighlight(h.fullName, query),
        }));
    }

    private _decodeOffset(searchAfter?: (string | number)[]): number {
        if (!searchAfter || searchAfter.length === 0) return 0;
        const value = searchAfter[0];
        const offset = typeof value === 'number' ? value : parseInt(String(value), 10);
        return Number.isFinite(offset) && offset >= 0 ? offset : 0;
    }

    private _rerankByMutualFriends(
        hits: SearchHit[],
        mutualCounts: Map<string, number>,
    ): SearchHit[] {
        const factor = Math.pow(10, SCORE_BUCKET_DECIMALS);
        const bucket = (score: number) => Math.round(score * factor) / factor;

        return [...hits].sort((a, b) => {
            const sa = bucket(a.score);
            const sb = bucket(b.score);
            if (sa !== sb) return sb - sa;
            const ma = mutualCounts.get(a.user.id) ?? 0;
            const mb = mutualCounts.get(b.user.id) ?? 0;
            return mb - ma;
        });
    }

    /**
     * Best-effort substring highlight. Wraps the matched range with <em>…</em>
     * (matching the format the FE's SearchHighlight component already parses).
     * If the query doesn't match raw-case (e.g. user typed "tuan", name is "Tuấn"),
     * we skip the highlight rather than over-engineer diacritic-aware position mapping.
     */
    private _buildHighlight(fullName: string, query: string): string | undefined {
        const q = query.trim().toLowerCase();
        if (!q) return undefined;
        const idx = fullName.toLowerCase().indexOf(q);
        if (idx === -1) return undefined;
        return (
            fullName.slice(0, idx) +
            '<em>' +
            fullName.slice(idx, idx + q.length) +
            '</em>' +
            fullName.slice(idx + q.length)
        );
    }
}
