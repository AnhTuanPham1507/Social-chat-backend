export class MessageDTO {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    serverTs: Date;
}

export interface SendTextMessageInput {
    conversationId: string;
    content: string;
}
