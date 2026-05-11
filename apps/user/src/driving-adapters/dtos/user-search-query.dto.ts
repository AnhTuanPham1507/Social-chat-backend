import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { UserDTO } from './user.dto';

export class UserSearchQueryDto {
    @ApiProperty({ description: 'Search query (full name, min 1 char after trim)' })
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MinLength(1)
    q: string;

    @ApiPropertyOptional({ description: 'Number of results', default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    size?: number = 20;

    /**
     * Opaque cursor — pass back the `nextSearchAfter` value from the prior response.
     * URL-encoded JSON of the ES sort tuple.
     */
    @ApiPropertyOptional({ description: 'Opaque pagination cursor (base64url-encoded JSON)' })
    @IsOptional()
    @IsString()
    searchAfter?: string;
}

export class PaginatedSearchUsersDTO {
    @ApiProperty({ type: [UserDTO], description: 'Ranked users for this page' })
    items: UserDTO[];

    @ApiProperty({ description: 'Total number of matching users across all pages' })
    total: number;

    @ApiProperty({ description: 'Whether more pages are available after this one' })
    hasMore: boolean;

    @ApiPropertyOptional({
        description: 'Opaque cursor to fetch the next page — pass as `searchAfter`. Null when exhausted.',
        nullable: true,
        type: String,
    })
    nextSearchAfter?: string | null;
}
