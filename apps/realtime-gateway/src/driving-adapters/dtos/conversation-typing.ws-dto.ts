import { IsUUID } from 'class-validator';

export class ConversationTypingWsDto {
    @IsUUID()
    conversationId: string;
}
