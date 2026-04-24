import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { REACTION_TYPE } from '@social-chat/domain';

export class ReactToPostDto {
    @ApiProperty({ description: 'Reaction type', enum: REACTION_TYPE })
    @IsEnum(REACTION_TYPE, { message: 'Reaction type must be one of: like, love, haha, wow, sad, angry' })
    type: REACTION_TYPE;
}
