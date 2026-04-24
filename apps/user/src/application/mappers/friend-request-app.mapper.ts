import { FriendRequestEntity } from '@social-chat/domain';
import { FriendRequest } from '../dtos/friend-request.dto';

export class FriendRequestAppMapper {
    static fromEntityToAppModel(entity: FriendRequestEntity): FriendRequest {
        return {
            id: entity.id,
            senderId: entity.senderId,
            receiverId: entity.receiverId,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
