import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { POST_VISIBILITY } from '@social-chat/domain';

export class SharePostDto {
    @ApiPropertyOptional({ description: 'Optional comment to add to the share (max 5000 characters)' })
    @IsOptional()
    @IsString()
    @MaxLength(5000, { message: 'Comment must not exceed 5000 characters' })
    comment?: string;

    @ApiPropertyOptional({
        description: 'Visibility of the share',
        enum: POST_VISIBILITY,
        default: POST_VISIBILITY.PUBLIC,
    })
    @IsOptional()
    @IsEnum(POST_VISIBILITY, { message: 'Visibility must be public, friends, or private' })
    visibility?: POST_VISIBILITY;
}
