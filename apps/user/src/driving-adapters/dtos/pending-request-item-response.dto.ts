import { ApiProperty } from '@nestjs/swagger';

export class PendingRequestItemResponseDto {
    @ApiProperty({ description: 'Friend request ID' })
    id: string;

    @ApiProperty({ description: 'The other user ID' })
    otherUserId: string;

    @ApiProperty({ description: 'The other user display name' })
    otherUserName: string;

    @ApiProperty({ description: 'The other user avatar URL', nullable: true })
    otherUserAvatarUrl: string | null;

    @ApiProperty({ description: 'Whether you sent or received this request', enum: ['sent', 'received'] })
    direction: 'sent' | 'received';

    @ApiProperty({ description: 'When the request was sent' })
    createdAt: Date;
}
