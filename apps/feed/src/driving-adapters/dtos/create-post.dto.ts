import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { POST_VISIBILITY } from '@social-chat/domain';

export class CreatePostDto {
    @ApiPropertyOptional({ description: 'Post content (max 5000 characters)' })
    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Post content must not exceed 5000 characters' })
    content?: string;

    @ApiPropertyOptional({ description: 'Post visibility', enum: POST_VISIBILITY, default: POST_VISIBILITY.PUBLIC })
    @IsOptional()
    @IsEnum(POST_VISIBILITY, { message: 'Visibility must be public, friends, or private' })
    visibility?: POST_VISIBILITY;

    @ApiPropertyOptional({ description: 'Asset keys to attach', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true, message: 'Each attachment key must be a string' })
    attachmentKeys?: string[];
}
