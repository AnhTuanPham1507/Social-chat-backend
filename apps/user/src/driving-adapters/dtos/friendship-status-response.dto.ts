import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FriendshipStatusResponseDto {
    @ApiProperty({
        description: 'Friendship status',
        enum: ['none', 'friends', 'request_sent', 'request_received'],
    })
    status: string;

    @ApiPropertyOptional({ description: 'Friend request ID (if a pending request exists)' })
    requestId?: string;
}
