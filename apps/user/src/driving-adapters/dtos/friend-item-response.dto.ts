import { ApiProperty } from '@nestjs/swagger';

export class FriendItemResponseDto {
    @ApiProperty({ description: 'Friend user ID' })
    userId: string;

    @ApiProperty({ description: 'Friend display name' })
    displayName: string;

    @ApiProperty({ description: 'Friend avatar URL', nullable: true })
    avatarUrl: string | null;

    @ApiProperty({ description: 'When the friendship was established' })
    friendshipDate: Date;
}

export class PaginatedFriendsResponseDto {
    @ApiProperty({ type: [FriendItemResponseDto] })
    data: FriendItemResponseDto[];

    @ApiProperty({ description: 'Total number of friends' })
    total: number;

    @ApiProperty({ description: 'Current page' })
    page: number;

    @ApiProperty({ description: 'Items per page' })
    limit: number;
}
