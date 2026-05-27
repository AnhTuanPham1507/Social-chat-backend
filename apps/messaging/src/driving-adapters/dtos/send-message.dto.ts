import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayMaxSize,
    IsArray,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

import { MESSAGE_CONTENT_MAX_LENGTH } from '@social-chat/domain';

const MAX_ATTACHMENTS_PER_MESSAGE = 10;

export class SendMessageDto {
    @ApiPropertyOptional({
        description: 'Message body text. Required if no attachments.',
        maxLength: MESSAGE_CONTENT_MAX_LENGTH,
    })
    @IsOptional()
    @IsString()
    @MaxLength(MESSAGE_CONTENT_MAX_LENGTH)
    content?: string;

    @ApiPropertyOptional({
        description:
            'Object-storage keys for attached assets (image, video, file). ' +
            'Required if no content.',
        type: [String],
        maxItems: MAX_ATTACHMENTS_PER_MESSAGE,
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(MAX_ATTACHMENTS_PER_MESSAGE)
    @IsString({ each: true })
    attachmentKeys?: string[];
}
