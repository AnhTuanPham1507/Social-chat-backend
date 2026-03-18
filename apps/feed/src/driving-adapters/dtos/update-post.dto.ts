import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { POST_VISIBILITY } from '@social-chat/domain';

export class UpdatePostDto {
    @ApiPropertyOptional({ description: 'Post content (max 5000 characters)' })
    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Post content must not exceed 5000 characters' })
    content?: string;

    @ApiPropertyOptional({ description: 'Post visibility', enum: POST_VISIBILITY })
    @IsOptional()
    @IsEnum(POST_VISIBILITY, { message: 'Visibility must be public, friends, or private' })
    visibility?: POST_VISIBILITY;
}
