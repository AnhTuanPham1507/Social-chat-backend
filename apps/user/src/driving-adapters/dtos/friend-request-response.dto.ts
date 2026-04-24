import { ApiProperty } from '@nestjs/swagger';

export class FriendRequestResponseDto {
    @ApiProperty({ description: 'Friend request ID' })
    id: string;

    @ApiProperty({ description: 'ID of the user who sent the request' })
    senderId: string;

    @ApiProperty({ description: 'ID of the user who receives the request' })
    receiverId: string;

    @ApiProperty({ description: 'Status of the friend request' })
    status: string;

    @ApiProperty({ description: 'When the request was created' })
    createdAt: Date;

    @ApiProperty({ description: 'When the request was last updated' })
    updatedAt: Date;
}
