import { Injectable } from '@nestjs/common';
import { FRIEND_REQUEST_STATUS, FriendRequestEntity } from '@social-chat/domain';
import { BaseFriendRequestRepository } from '@social-chat/infrastructure';
import { IFriendRequestRepository, PendingRequestItem } from '@application/contracts/friend-request-repository.contract';
import { FriendRequestPersistenceMapper } from './mappers/friend-request-persistence.mapper';

@Injectable()
export class FriendRequestRepo implements IFriendRequestRepository {
    constructor(
        private readonly _friendRequestRepo: BaseFriendRequestRepository,
    ) {}

    async insert(friendRequest: FriendRequestEntity): Promise<void> {
        const model = FriendRequestPersistenceMapper.fromEntityToModel(friendRequest);
        await this._friendRequestRepo.create(model);
    }

    async findById(id: string): Promise<FriendRequestEntity | null> {
        const model = await this._friendRequestRepo.findById(id);
        if (!model) return null;
        return FriendRequestPersistenceMapper.fromModelToEntity(model);
    }

    async update(friendRequest: FriendRequestEntity): Promise<void> {
        const model = FriendRequestPersistenceMapper.fromEntityToModel(friendRequest);
        await this._friendRequestRepo.update(friendRequest.id, model);
    }

    async existsPendingBetween(senderId: string, receiverId: string): Promise<boolean> {
        return this._friendRequestRepo.existsBy({
            senderId,
            receiverId,
            status: FRIEND_REQUEST_STATUS.PENDING,
        });
    }

    async declinePendingBetween(userIdA: string, userIdB: string): Promise<void> {
        await this._friendRequestRepo.updateMany(
            { senderId: userIdA, receiverId: userIdB, status: FRIEND_REQUEST_STATUS.PENDING },
            { status: FRIEND_REQUEST_STATUS.DECLINED } as any,
        );
        await this._friendRequestRepo.updateMany(
            { senderId: userIdB, receiverId: userIdA, status: FRIEND_REQUEST_STATUS.PENDING },
            { status: FRIEND_REQUEST_STATUS.DECLINED } as any,
        );
    }

    async findPendingBetween(userIdA: string, userIdB: string): Promise<FriendRequestEntity | null> {
        // Check both directions
        let model = await this._friendRequestRepo.findOne({
            senderId: userIdA,
            receiverId: userIdB,
            status: FRIEND_REQUEST_STATUS.PENDING,
        });
        if (!model) {
            model = await this._friendRequestRepo.findOne({
                senderId: userIdB,
                receiverId: userIdA,
                status: FRIEND_REQUEST_STATUS.PENDING,
            });
        }
        if (!model) return null;
        return FriendRequestPersistenceMapper.fromModelToEntity(model);
    }

    async findPendingForUser(userId: string): Promise<PendingRequestItem[]> {
        // Received requests — join with sender info
        const received = await this._friendRequestRepo
            .getRepository()
            .createQueryBuilder('fr')
            .innerJoin('fr.sender', 'u')
            .select([
                'fr.id AS "id"',
                'u.id AS "otherUserId"',
                'u.full_name AS "otherUserName"',
                'u.avatar_url AS "otherUserAvatarUrl"',
                'fr.created_at AS "createdAt"',
            ])
            .addSelect("'received'", 'direction')
            .where('fr.receiverId = :userId', { userId })
            .andWhere('fr.status = :status', { status: FRIEND_REQUEST_STATUS.PENDING })
            .getRawMany();

        // Sent requests — join with receiver info
        const sent = await this._friendRequestRepo
            .getRepository()
            .createQueryBuilder('fr')
            .innerJoin('fr.receiver', 'u')
            .select([
                'fr.id AS "id"',
                'u.id AS "otherUserId"',
                'u.full_name AS "otherUserName"',
                'u.avatar_url AS "otherUserAvatarUrl"',
                'fr.created_at AS "createdAt"',
            ])
            .addSelect("'sent'", 'direction')
            .where('fr.senderId = :userId', { userId })
            .andWhere('fr.status = :status', { status: FRIEND_REQUEST_STATUS.PENDING })
            .getRawMany();

        const all = [...received, ...sent].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        return all.map((row) => ({
            id: row.id,
            otherUserId: row.otherUserId,
            otherUserName: row.otherUserName,
            otherUserAvatarUrl: row.otherUserAvatarUrl || null,
            direction: row.direction,
            createdAt: row.createdAt,
        }));
    }

    async delete(id: string): Promise<void> {
        await this._friendRequestRepo.hardDelete(id);
    }
}
