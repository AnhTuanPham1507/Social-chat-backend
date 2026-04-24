import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { USER_SEX } from '@social-chat/domain';

export class UpdateProfileDto {
    @ApiPropertyOptional({ description: 'Full name (2-100 characters)' })
    @IsOptional()
    @IsString()
    @Length(2, 100, { message: 'Full name must be between 2 and 100 characters' })
    fullName?: string;

    @ApiPropertyOptional({ description: 'Phone number' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Gender/Sex', enum: USER_SEX })
    @IsOptional()
    @IsEnum(USER_SEX, { message: 'Sex must be MALE, FEMALE, or UNKNOWN' })
    sex?: USER_SEX;

    @ApiPropertyOptional({ description: 'Avatar object key from asset service (e.g., avatars/uuid-123.jpg)' })
    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @ApiPropertyOptional({ description: 'List of user interests', example: ['gaming', 'cooking', 'music'], type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interests?: string[];
}
