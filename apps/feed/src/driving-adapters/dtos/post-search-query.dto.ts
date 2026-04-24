import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

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
}
