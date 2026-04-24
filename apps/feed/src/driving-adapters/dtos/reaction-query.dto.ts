import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { REACTION_TYPE } from '@social-chat/domain';

export class ReactionQueryDto {
    @ApiPropertyOptional({ description: 'Cursor for pagination (reaction ID of last item)' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({ description: 'Filter by reaction type', enum: REACTION_TYPE })
    @IsOptional()
    @IsEnum(REACTION_TYPE)
    type?: REACTION_TYPE;
}
