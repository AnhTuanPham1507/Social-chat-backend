import { FriendRequest } from '@application/dtos/friend-request.dto';
import { FriendRequestResponseDto } from '../dtos/friend-request-response.dto';

export class FriendRequestMapper {
    static fromAppModelToDTO(appModel: FriendRequest): FriendRequestResponseDto {
        return {
            id: appModel.id,
            senderId: appModel.senderId,
            receiverId: appModel.receiverId,
            status: appModel.status,
            createdAt: appModel.createdAt,
            updatedAt: appModel.updatedAt,
        };
    }
}
