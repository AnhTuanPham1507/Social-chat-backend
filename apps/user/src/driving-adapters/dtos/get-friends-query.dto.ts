import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum FriendSortBy {
    NAME = 'name',
    FRIENDSHIP_DATE = 'friendshipDate',
}

export class GetFriendsQueryDto {
    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    @ApiPropertyOptional({ description: 'Sort by field', enum: FriendSortBy, default: FriendSortBy.NAME })
    @IsOptional()
    @IsEnum(FriendSortBy)
    sortBy: FriendSortBy = FriendSortBy.NAME;
}
