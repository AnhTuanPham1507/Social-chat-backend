import { FriendRequestEntity } from '@social-chat/domain';
import { FriendRequestModel } from '@social-chat/infrastructure';

export class FriendRequestPersistenceMapper {
    static fromEntityToModel(entity: FriendRequestEntity): Partial<FriendRequestModel> {
        return {
            id: entity.id,
            senderId: entity.senderId,
            receiverId: entity.receiverId,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    static fromModelToEntity(model: FriendRequestModel): FriendRequestEntity {
        return FriendRequestEntity.reconstitute({
            id: model.id,
            senderId: model.senderId,
            receiverId: model.receiverId,
            status: model.status,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }
}
