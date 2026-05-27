export class MessageDTO {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentKeys: string[];
    serverTs: Date;
}

export interface SendMessageInput {
    messageId: string;
    conversationId: string;
    content: string;
    attachmentKeys?: string[];
}
