import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { MESSAGE_CONTENT_MAX_LENGTH } from '@social-chat/domain';

export class SendMessageDto {
    @ApiProperty({
        description: 'Message body text',
        minLength: 1,
        maxLength: MESSAGE_CONTENT_MAX_LENGTH,
    })
    @IsString()
    @MinLength(1)
    @MaxLength(MESSAGE_CONTENT_MAX_LENGTH)
    content: string;
}
