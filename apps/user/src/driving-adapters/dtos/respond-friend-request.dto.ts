import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FriendRequestAction } from '@application/dtos/friend-request.dto';

export class RespondFriendRequestDto {
    @ApiProperty({
        description: 'Action to take on the friend request',
        enum: FriendRequestAction,
        example: FriendRequestAction.ACCEPT,
    })
    @IsNotEmpty()
    @IsEnum(FriendRequestAction)
    action: FriendRequestAction;
}
