import { IsIn, IsUUID } from 'class-validator';

export type TypingState = 'started' | 'stopped';

export class ConversationTypingWsDto {
    @IsUUID()
    conversationId: string;

    @IsIn(['started', 'stopped'])
    state: TypingState;
}
