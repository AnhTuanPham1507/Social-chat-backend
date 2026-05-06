import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { PostDTO } from './post.dto';

export class PostSearchQueryDto {
    @ApiProperty({ description: 'Search query text' })
    @IsString()
    @MinLength(1)
    q: string;

    @ApiPropertyOptional({ description: 'Filter by visibility (PUBLIC, FRIENDS, PRIVATE)' })
    @IsOptional()
    @IsString()
    visibility?: string;

    @ApiPropertyOptional({ description: 'Filter by author ID' })
    @IsOptional()
    @IsString()
    authorId?: string;

    @ApiPropertyOptional({ description: 'Filter posts from this date (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ description: 'Filter posts until this date (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional({ description: 'Number of results', default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    size?: number = 20;

    /**
     * Opaque cursor for the next page — pass back the `nextSearchAfter`
     * value the server returned. URL-encoded JSON of the ES sort tuple.
     */
    @ApiPropertyOptional({ description: 'Opaque pagination cursor (URL-encoded JSON)' })
    @IsOptional()
    @IsString()
    searchAfter?: string;
}

export class PaginatedSearchPostsDTO {
    @ApiProperty({ type: [PostDTO], description: 'Enriched, ranked posts for this page' })
    items: PostDTO[];

    @ApiProperty({ description: 'Total number of matching posts across all pages' })
    total: number;

    @ApiProperty({ description: 'Whether more pages are available after this one' })
    hasMore: boolean;

    @ApiPropertyOptional({
        description: 'Opaque cursor to fetch the next page — pass as `searchAfter` query param. Null when exhausted.',
        nullable: true,
        type: String,
    })
    nextSearchAfter?: string | null;
}
