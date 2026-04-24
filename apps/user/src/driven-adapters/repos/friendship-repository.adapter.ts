import { Injectable } from '@nestjs/common';
import { FRIENDSHIP_TYPE, FriendshipEntity } from '@social-chat/domain';
import { BaseFriendshipRepository } from '@social-chat/infrastructure';
import { IFriendshipRepository, MutualFriendCandidate } from '@application/contracts/friendship-repository.contract';
import { FriendItem } from '@application/dtos/friendship.dto';

@Injectable()
export class FriendshipRepo implements IFriendshipRepository {
    constructor(
        private readonly _friendshipRepo: BaseFriendshipRepository,
    ) {}

    async findFriendsByUserId(
        userId: string,
        options: { page: number; limit: number; sortBy: 'name' | 'friendshipDate' },
    ): Promise<{ data: FriendItem[]; total: number }> {
        const { page, limit, sortBy } = options;
        const skip = (page - 1) * limit;

        const qb = this._friendshipRepo
            .getRepository()
            .createQueryBuilder('f')
            .innerJoin('f.friend', 'u')
            .select([
                'u.id AS "userId"',
                'u.full_name AS "displayName"',
                'u.avatar_url AS "avatarUrl"',
                'f.created_at AS "friendshipDate"',
            ])
            .where('f.userId = :userId', { userId })
            .andWhere('f.type = :type', { type: FRIENDSHIP_TYPE.FRIEND });

        // Sorting
        if (sortBy === 'name') {
            qb.orderBy('"displayName"', 'ASC');
        } else {
            qb.orderBy('"friendshipDate"', 'DESC');
        }

        // Get total count
        const total = await qb.getCount();

        // Apply pagination
        const rawResults = await qb.offset(skip).limit(limit).getRawMany();

        const data: FriendItem[] = rawResults.map((row) => ({
            userId: row.userId,
            displayName: row.displayName,
            avatarUrl: row.avatarUrl || null,
            friendshipDate: row.friendshipDate,
        }));

        return { data, total };
    }

    async findBetween(userId: string, friendId: string): Promise<FriendshipEntity | null> {
        const model = await this._friendshipRepo.findOne({
            userId,
            friendId,
            type: FRIENDSHIP_TYPE.FRIEND,
        });
        if (!model) return null;

        return FriendshipEntity.reconstitute({
            id: model.id,
            userId: model.userId,
            friendId: model.friendId,
            type: model.type,
            createdAt: model.createdAt,
        });
    }

    async deleteBetween(userId: string, friendId: string): Promise<void> {
        const repo = this._friendshipRepo.getRepository();
        await repo.delete([
            { userId, friendId, type: FRIENDSHIP_TYPE.FRIEND },
            { userId: friendId, friendId: userId, type: FRIENDSHIP_TYPE.FRIEND },
        ]);
    }

    async blockBetween(blocker: FriendshipEntity, blocked: FriendshipEntity): Promise<void> {
        const repo = this._friendshipRepo.getRepository();

        // Upsert: if FRIEND rows exist, update type; otherwise insert new rows
        await repo.upsert(
            [
                { id: blocker.id, userId: blocker.userId, friendId: blocker.friendId, type: blocker.type },
                { id: blocked.id, userId: blocked.userId, friendId: blocked.friendId, type: blocked.type },
            ],
            {
                conflictPaths: ['userId', 'friendId'],
                skipUpdateIfNoValuesChanged: true,
            },
        );
    }

    async existsBlockBetween(userIdA: string, userIdB: string): Promise<boolean> {
        return this._friendshipRepo.existsBy({
            userId: userIdA,
            friendId: userIdB,
            type: FRIENDSHIP_TYPE.BLOCKED,
        });
    }

    async findBlockBetween(blockerId: string, blockedId: string): Promise<FriendshipEntity | null> {
        const model = await this._friendshipRepo.findOne({
            userId: blockerId,
            friendId: blockedId,
            type: FRIENDSHIP_TYPE.BLOCKED,
        });
        if (!model) return null;

        return FriendshipEntity.reconstitute({
            id: model.id,
            userId: model.userId,
            friendId: model.friendId,
            type: model.type,
            createdAt: model.createdAt,
        });
    }

    async deleteBlockBetween(blockerId: string, blockedId: string): Promise<void> {
        const repo = this._friendshipRepo.getRepository();
        await repo.delete([
            { userId: blockerId, friendId: blockedId, type: FRIENDSHIP_TYPE.BLOCKED },
            { userId: blockedId, friendId: blockerId, type: FRIENDSHIP_TYPE.BLOCKED_BY },
        ]);
    }

    async findMutualFriendCandidates(userId: string): Promise<MutualFriendCandidate[]> {
        const repo = this._friendshipRepo.getRepository();

        // Adamic-Adar: AA(u,v) = Σ 1/ln(|N(w)|) for each mutual friend w
        // |N(w)| = number of friends that mutual friend w has (their degree)
        //
        // Why Adamic-Adar over raw mutual count?
        //   A mutual friend with 3 connections is a much stronger signal
        //   than one with 500 connections. The 1/ln(degree) weighting
        //   captures this: rare connectors contribute more to the score.
        //
        // The friend_degrees CTE pre-computes each user's friend count once,
        // then the main query joins it per mutual friend to sum the AA weight.
        const results = await repo.query(
            `
            WITH friend_degrees AS (
                SELECT "user_id", COUNT(*)::int AS degree
                FROM friendships
                WHERE type = 'friend'
                GROUP BY "user_id"
            )
            SELECT
                fof."friend_id"                          AS "userId",
                u.full_name                              AS "displayName",
                u.avatar_url                             AS "avatarUrl",
                COUNT(*)::int                            AS "mutualFriendsCount",
                SUM(
                    CASE
                        WHEN fd.degree > 1 THEN 1.0 / LN(fd.degree::float)
                        ELSE 0
                    END
                )                                        AS "adamicAdarScore",
                u.interests                              AS "interests"
            FROM friendships my_friends
            INNER JOIN friendships fof
                ON fof."user_id" = my_friends."friend_id"
                AND fof.type = 'friend'
                AND fof."friend_id" != $1
            INNER JOIN users u
                ON u.id = fof."friend_id"
            INNER JOIN friend_degrees fd
                ON fd."user_id" = fof."user_id"
            WHERE my_friends."user_id" = $1
              AND my_friends.type = 'friend'
              AND NOT EXISTS (
                  SELECT 1 FROM friendships df
                  WHERE df."user_id" = $1
                    AND df."friend_id" = fof."friend_id"
                    AND df.type = 'friend'
              )
              AND NOT EXISTS (
                  SELECT 1 FROM friendships blk
                  WHERE (blk."user_id" = $1 AND blk."friend_id" = fof."friend_id" AND blk.type = 'blocked')
                     OR (blk."user_id" = fof."friend_id" AND blk."friend_id" = $1 AND blk.type = 'blocked')
              )
            GROUP BY fof."friend_id", u.full_name, u.avatar_url, u.interests
            ORDER BY "adamicAdarScore" DESC
            `,
            [userId],
        );

        return results.map((r: any) => ({
            ...r,
            adamicAdarScore: parseFloat(r.adamicAdarScore) || 0,
            interests: r.interests ?? [],
        }));
    }

    async getAllUserIds(): Promise<string[]> {
        const repo = this._friendshipRepo.getRepository();
        const results = await repo.query(
            `SELECT DISTINCT "user_id" FROM friendships WHERE type = 'friend'`,
        );
        return results.map((r: { user_id: string }) => r.user_id);
    }
}
