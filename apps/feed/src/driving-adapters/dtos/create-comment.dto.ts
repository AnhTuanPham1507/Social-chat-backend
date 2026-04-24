import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
    @ApiProperty({ description: 'Comment content', maxLength: 2000 })
    @IsString()
    @IsOptional()
    @MaxLength(2000)
    content?: string;

    @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
    @IsOptional()
    @IsUUID()
    parentCommentId?: string;

    @ApiPropertyOptional({ description: 'Attachment keys', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    attachments?: string[];
}
