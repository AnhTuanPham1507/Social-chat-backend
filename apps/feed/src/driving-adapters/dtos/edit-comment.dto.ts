import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class EditCommentDto {
    @ApiProperty({ description: 'New comment content', maxLength: 2000 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({ description: 'New attachment object keys (replaces existing). Send empty array to remove all attachments.', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}
