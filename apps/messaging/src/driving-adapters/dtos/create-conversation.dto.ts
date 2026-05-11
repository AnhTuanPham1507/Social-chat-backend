import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator';

import { CONVERSATION_TYPE, GROUP_MEMBER_CAP } from '@social-chat/domain';

export class CreateConversationDto {
    @ApiProperty({ enum: CONVERSATION_TYPE, description: 'Conversation type' })
    @IsEnum(CONVERSATION_TYPE)
    type: CONVERSATION_TYPE;

    @ApiProperty({
        type: [String],
        description:
            'For DM: exactly 2 user IDs (must include the caller). For Group: 1..1024 user IDs (must include the caller).',
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(GROUP_MEMBER_CAP)
    @ArrayUnique()
    @IsUUID('4', { each: true })
    memberIds: string[];

    @ApiPropertyOptional({
        description: 'Required for GROUP, ignored for DM',
        minLength: 1,
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;
}
