import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageSenderResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    displayName: string;

    @ApiPropertyOptional()
    avatarUrl?: string;
}

export class MessageWithSenderResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    conversationId: string;

    @ApiProperty()
    senderId: string;

    @ApiProperty()
    content: string;

    @ApiProperty({ type: [String], description: 'Object-storage keys for attached assets' })
    attachmentKeys: string[];

    @ApiProperty()
    serverTs: Date;

    @ApiPropertyOptional({
        type: () => MessageSenderResponse,
        description:
            'Sender profile snapshot. Null when CDC has not yet projected the sender (eventual consistency).',
    })
    sender: MessageSenderResponse | null;
}

export class MessageHistoryResponse {
    @ApiProperty({ type: () => [MessageWithSenderResponse] })
    items: MessageWithSenderResponse[];

    @ApiPropertyOptional({
        description:
            'Opaque cursor for fetching the next (older) page, or null when there is no more history.',
        nullable: true,
    })
    nextCursor: string | null;

    @ApiProperty()
    hasMore: boolean;
}
