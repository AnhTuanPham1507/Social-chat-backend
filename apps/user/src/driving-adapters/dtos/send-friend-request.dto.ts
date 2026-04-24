import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SendFriendRequestDto {
    @ApiProperty({ description: 'Target user ID to send friend request to' })
    @IsNotEmpty()
    @IsUUID()
    targetUserId: string;
}
