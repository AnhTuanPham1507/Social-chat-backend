import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class AutocompleteQueryDto {
    @ApiProperty({ description: 'Autocomplete prefix query (min 2 chars after trim)' })
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MinLength(2)
    q: string;

    @ApiPropertyOptional({ description: 'Filter by visibility (PUBLIC, FRIENDS, PRIVATE)' })
    @IsOptional()
    @IsString()
    visibility?: string;

    @ApiPropertyOptional({ description: 'Number of suggestions', default: 8, minimum: 1, maximum: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    size?: number = 8;
}

export class AutocompleteSuggestionDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    text: string;

    @ApiPropertyOptional()
    highlight?: string;
}
