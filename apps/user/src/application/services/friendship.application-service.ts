import { ConflictException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DOMAIN_EVENT_BUS_TOKEN, FriendRequestEntity, FriendshipEntity, IDomainEventBus } from '@social-chat/domain';
import { FriendRequest, FriendRequestAction, RespondFriendRequestInput, SendFriendRequestInput } from '../dtos/friend-request.dto';
import { BlockUserInput, FriendItem, GetFriendsInput, PaginatedResult, UnblockUserInput, UnfriendInput } from '../dtos/friendship.dto';
import { FriendSuggestionItem } from '../dtos/friend-suggestion.dto';
import { FRIEND_REQUEST_REPO_TOKEN, IFriendRequestRepository, PendingRequestItem } from '../contracts/friend-request-repository.contract';
import { FRIENDSHIP_REPO_TOKEN, IFriendshipRepository, MutualFriendCandidate } from '../contracts/friendship-repository.contract';
import { IUserRepository, USER_REPO_TOKEN } from '../contracts/user-repository.contract';
import { FriendRequestAppMapper } from '../mappers/friend-request-app.mapper';
import { RedisBaseService, REDIS_SERVICE_TOKEN } from '@social-chat/infrastructure';

export enum FriendshipStatus {
    NONE = 'none',
    FRIENDS = 'friends',
    REQUEST_SENT = 'request_sent',
    REQUEST_RECEIVED = 'request_received',
}

export interface FriendshipStatusResult {
    status: FriendshipStatus;
    requestId?: string;
}

export interface CancelFriendRequestInput {
    requestId: string;
    currentUserId: string;
}

export const FRIENDSHIP_APPLICATION_SERVICE_TOKEN = Symbol('FRIENDSHIP_APPLICATION_SERVICE_TOKEN');

export interface IFriendshipApplicationService {
    sendFriendRequest(input: SendFriendRequestInput): Promise<FriendRequest>;
    respondToFriendRequest(input: RespondFriendRequestInput): Promise<FriendRequest>;
    getFriends(input: GetFriendsInput): Promise<PaginatedResult<FriendItem>>;
    unfriend(input: UnfriendInput): Promise<void>;
    blockUser(input: BlockUserInput): Promise<void>;
    unblockUser(input: UnblockUserInput): Promise<void>;
    getFriendshipStatus(currentUserId: string, targetUserId: string): Promise<FriendshipStatusResult>;
    cancelFriendRequest(input: CancelFriendRequestInput): Promise<void>;
    getPendingRequests(userId: string): Promise<PendingRequestItem[]>;
    getSuggestions(userId: string): Promise<FriendSuggestionItem[]>;
}

const SUGGESTIONS_CACHE_KEY_PREFIX = 'friend_suggestions';
const SUGGESTIONS_LIMIT = 10;
const SUGGESTIONS_TTL = 3700; // slightly over 1 hour to avoid gap between cron runs

// Sigmoid parameters for normalizing raw scores to [0, 1].
// sigmoid(x) = 1 / (1 + e^(-k*(x - x0)))
//
// k  = steepness — how sharply the curve transitions from 0→1.
// x0 = midpoint — the raw score that maps to 0.5 (50% confidence).
//
// Why sigmoid? Raw scores have no upper bound and vary wildly across users.
// Sigmoid compresses this into a uniform 0–1 range, making scores comparable
// across different network topologies.
const SIGMOID_K = 1;
const SIGMOID_X0 = 2;

// Weights for combining Adamic-Adar (structural) and Jaccard (interest) signals.
//
// Why 0.7/0.3? Facebook/LinkedIn research shows mutual friends (structural proximity)
// is a stronger predictor of future friendship than shared interests alone.
// Interests act as a tie-breaker when two candidates have similar AA scores.
//
// Example: candidate A has AA=2.0, Jaccard=0.0 → combined = 0.7*0.5 + 0.3*0.0 = 0.35
//          candidate B has AA=1.5, Jaccard=0.8 → combined = 0.7*0.38 + 0.3*0.8 = 0.51
//          B wins despite weaker network signal, because strong interest overlap.
const WEIGHT_ADAMIC_ADAR = 0.8;
const WEIGHT_JACCARD = 0.2;

@Injectable()
export class FriendshipApplicationService implements IFriendshipApplicationService {
    private readonly _logger = new Logger(FriendshipApplicationService.name);

    constructor(
        @Inject(FRIEND_REQUEST_REPO_TOKEN)
        private readonly _friendRequestRepo: IFriendRequestRepository,
        @Inject(FRIENDSHIP_REPO_TOKEN)
        private readonly _friendshipRepo: IFriendshipRepository,
        @Inject(USER_REPO_TOKEN)
        private readonly _userRepo: IUserRepository,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
        @Inject(REDIS_SERVICE_TOKEN.CACHE_SERVICE)
        private readonly _cacheService: RedisBaseService,
    ) {}

    // ── Friend Request ──────────────────────────────────────

    async sendFriendRequest(input: SendFriendRequestInput): Promise<FriendRequest> {
        const targetUser = await this._userRepo.findById(input.receiverId);
        if (!targetUser) {
            throw new NotFoundException('Target user not found');
        }

        const existsPending = await this._friendRequestRepo.existsPendingBetween(
            input.senderId,
            input.receiverId,
        );
        if (existsPending) {
            throw new ConflictException('A pending friend request already exists');
        }

        const friendRequest = FriendRequestEntity.create({
            senderId: input.senderId,
            receiverId: input.receiverId,
        });

        await this._friendRequestRepo.insert(friendRequest);

        const events = friendRequest.publishEvents();
        await this._domainEventBus.publishAll(events);

        return FriendRequestAppMapper.fromEntityToAppModel(friendRequest);
    }

    async respondToFriendRequest(input: RespondFriendRequestInput): Promise<FriendRequest> {
        const friendRequest = await this._friendRequestRepo.findById(input.requestId);
        if (!friendRequest) {
            throw new NotFoundException('Friend request not found');
        }

        if (friendRequest.receiverId !== input.currentUserId) {
            throw new ForbiddenException('Only the request recipient can respond');
        }

        if (input.action === FriendRequestAction.ACCEPT) {
            friendRequest.accept(input.currentUserId);

            // Materialize the bidirectional friendship as two FRIEND rows.
            // Insert before updating the request so that, on a unique-violation
            // (rows somehow already exist), the request stays PENDING and the
            // caller can retry rather than ending up with status=ACCEPTED but
            // no friendship — which is exactly the bug we're fixing.
            const rowA = FriendshipEntity.create({
                userId: friendRequest.senderId,
                friendId: friendRequest.receiverId,
            });
            const rowB = FriendshipEntity.create({
                userId: friendRequest.receiverId,
                friendId: friendRequest.senderId,
            });
            await this._friendshipRepo.createFriendshipPair(rowA, rowB);
        } else {
            friendRequest.decline(input.currentUserId);
        }

        await this._friendRequestRepo.update(friendRequest);

        const events = friendRequest.publishEvents();
        await this._domainEventBus.publishAll(events);

        return FriendRequestAppMapper.fromEntityToAppModel(friendRequest);
    }

    // ── Friendship ──────────────────────────────────────────

    async getFriends(input: GetFriendsInput): Promise<PaginatedResult<FriendItem>> {
        const { data, total } = await this._friendshipRepo.findFriendsByUserId(
            input.currentUserId,
            {
                page: input.page,
                limit: input.limit,
                sortBy: input.sortBy,
            },
        );

        return {
            data,
            total,
            page: input.page,
            limit: input.limit,
        };
    }

    async unfriend(input: UnfriendInput): Promise<void> {
        const friendship = await this._friendshipRepo.findBetween(
            input.currentUserId,
            input.targetUserId,
        );
        if (!friendship) {
            throw new NotFoundException('Friendship not found');
        }

        friendship.remove(input.currentUserId);

        await this._friendshipRepo.deleteBetween(input.currentUserId, input.targetUserId);

        const events = friendship.publishEvents();
        await this._domainEventBus.publishAll(events);
    }

    async blockUser(input: BlockUserInput): Promise<void> {
        const targetUser = await this._userRepo.findById(input.blockedId);
        if (!targetUser) {
            throw new NotFoundException('Target user not found');
        }

        const alreadyBlocked = await this._friendshipRepo.existsBlockBetween(input.blockerId, input.blockedId);
        if (alreadyBlocked) {
            throw new ConflictException('User is already blocked');
        }

        // Create both symmetric block rows (BLOCKED + BLOCKED_BY)
        const [blockerRow, blockedRow] = FriendshipEntity.createBlock({
            blockerId: input.blockerId,
            blockedId: input.blockedId,
        });

        // Upsert: converts existing FRIEND rows to BLOCKED/BLOCKED_BY, or inserts new ones
        await this._friendshipRepo.blockBetween(blockerRow, blockedRow);

        // Decline any pending friend requests between them
        await this._friendRequestRepo.declinePendingBetween(input.blockerId, input.blockedId);

        // Publish domain events
        const events = blockerRow.publishEvents();
        await this._domainEventBus.publishAll(events);
    }

    async unblockUser(input: UnblockUserInput): Promise<void> {
        const block = await this._friendshipRepo.findBlockBetween(input.unblockerId, input.unblockedId);
        if (!block) {
            throw new NotFoundException('Block relationship not found');
        }

        block.unblock(input.unblockerId);

        await this._friendshipRepo.deleteBlockBetween(input.unblockerId, input.unblockedId);

        const events = block.publishEvents();
        await this._domainEventBus.publishAll(events);
    }

    async getFriendshipStatus(currentUserId: string, targetUserId: string): Promise<FriendshipStatusResult> {
        // Check if already friends
        const friendship = await this._friendshipRepo.findBetween(currentUserId, targetUserId);
        if (friendship) {
            return { status: FriendshipStatus.FRIENDS };
        }

        // Check for pending friend request in either direction
        const pendingRequest = await this._friendRequestRepo.findPendingBetween(currentUserId, targetUserId);
        if (pendingRequest) {
            if (pendingRequest.senderId === currentUserId) {
                return { status: FriendshipStatus.REQUEST_SENT, requestId: pendingRequest.id };
            }
            return { status: FriendshipStatus.REQUEST_RECEIVED, requestId: pendingRequest.id };
        }

        return { status: FriendshipStatus.NONE };
    }

    async cancelFriendRequest(input: CancelFriendRequestInput): Promise<void> {
        const friendRequest = await this._friendRequestRepo.findById(input.requestId);
        if (!friendRequest) {
            throw new NotFoundException('Friend request not found');
        }

        if (friendRequest.senderId !== input.currentUserId) {
            throw new ForbiddenException('Only the sender can cancel a friend request');
        }

        await this._friendRequestRepo.delete(input.requestId);
    }

    async getPendingRequests(userId: string): Promise<PendingRequestItem[]> {
        return this._friendRequestRepo.findPendingForUser(userId);
    }

    // ── Friend Suggestions ─────────────────────────────────

    async getSuggestions(userId: string): Promise<FriendSuggestionItem[]> {
        const cacheKey = `${SUGGESTIONS_CACHE_KEY_PREFIX}:${userId}`;
        const cached = await this._cacheService.get<FriendSuggestionItem[]>(cacheKey);

        if (cached) {
            return cached;
        }

        // Cache miss — compute on-the-fly as fallback (cold start)
        return this._computeSuggestionsForUser(userId);
    }

    @Cron(CronExpression.EVERY_HOUR)
    async computeAllSuggestions(): Promise<void> {
        this._logger.log('Starting friend suggestions cron job...');

        const userIds = await this._friendshipRepo.getAllUserIds();
        let processed = 0;

        for (const userId of userIds) {
            try {
                await this._computeSuggestionsForUser(userId);
                processed++;
            } catch (error) {
                this._logger.error(`Failed to compute suggestions for user ${userId}`, error);
            }
        }

        this._logger.log(`Friend suggestions cron completed. Processed ${processed}/${userIds.length} users.`);
    }

    private async _computeSuggestionsForUser(userId: string): Promise<FriendSuggestionItem[]> {
        // Fetch candidates (with AA scores) and current user's interests in parallel
        const [candidates, currentUser] = await Promise.all([
            this._friendshipRepo.findMutualFriendCandidates(userId),
            this._userRepo.findById(userId),
        ]);

        const myInterests = currentUser?.interests ?? [];

        // Score each candidate using combined AA + Jaccard
        const scored = candidates.map((c) => {
            const aaScore = this._sigmoid(c.adamicAdarScore);
            const jaccardScore = this._jaccard(myInterests, c.interests);
            const combinedScore = WEIGHT_ADAMIC_ADAR * aaScore + WEIGHT_JACCARD * jaccardScore;

            return {
                userId: c.userId,
                displayName: c.displayName,
                avatarUrl: c.avatarUrl,
                mutualFriendsCount: c.mutualFriendsCount,
                score: combinedScore,
            };
        });

        // Rank by combined score and take top N
        const suggestions: FriendSuggestionItem[] = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, SUGGESTIONS_LIMIT)
            .map(({ score, ...rest }) => rest);

        // Top up with random users when mutual-friend signal can't fill the slate
        // (e.g. brand-new user with 0 friends, or a user whose candidates were thin).
        if (suggestions.length < SUGGESTIONS_LIMIT) {
            const remaining = SUGGESTIONS_LIMIT - suggestions.length;
            const excludeIds = suggestions.map((s) => s.userId);
            const fillers = await this._friendshipRepo.findRandomUsersExcluding(
                userId,
                remaining,
                excludeIds,
            );
            for (const f of fillers) {
                suggestions.push({
                    userId: f.userId,
                    displayName: f.displayName,
                    avatarUrl: f.avatarUrl,
                    mutualFriendsCount: 0,
                });
            }
        }

        const cacheKey = `${SUGGESTIONS_CACHE_KEY_PREFIX}:${userId}`;
        await this._cacheService.setWithExpireTime(cacheKey, suggestions, SUGGESTIONS_TTL);

        return suggestions;
    }

    /**
     * Sigmoid normalization: maps an unbounded raw score into [0, 1].
     *
     * For x = 0  → ≈ 0.12 (low confidence)
     * For x = 2  → = 0.50 (midpoint)
     * For x = 5  → ≈ 0.95 (high confidence)
     */
    private _sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-SIGMOID_K * (x - SIGMOID_X0)));
    }

    /**
     * Jaccard similarity: |A ∩ B| / |A ∪ B|
     *
     * Measures overlap between two interest sets.
     * Returns 0 when either set is empty (no signal, not a penalty).
     *
     * Examples:
     *   ['gaming', 'music'] vs ['gaming', 'cooking'] → 1/3 ≈ 0.33
     *   ['gaming', 'music'] vs ['gaming', 'music']   → 2/2 = 1.0
     *   ['gaming']          vs ['cooking']            → 0/2 = 0.0
     */
    private _jaccard(setA: string[], setB: string[]): number {
        if (setA.length === 0 || setB.length === 0) {
            return 0;
        }

        const a = new Set(setA);
        const b = new Set(setB);

        let intersection = 0;
        for (const item of a) {
            if (b.has(item)) {
                intersection++;
            }
        }

        const union = a.size + b.size - intersection;

        return union === 0 ? 0 : intersection / union;
    }
}
