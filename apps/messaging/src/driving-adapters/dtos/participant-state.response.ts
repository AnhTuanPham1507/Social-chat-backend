import { ApiProperty } from '@nestjs/swagger';

export class ParticipantStateResponse {
    @ApiProperty({ description: 'User this watermark belongs to' })
    userId: string;

    @ApiProperty({
        description:
            'UUIDv7 of the latest message this user has read in the conversation, or null if they have not acked any read yet',
        nullable: true,
    })
    lastReadMessageId: string | null;

    @ApiProperty({
        description:
            'Server-stamped ISO timestamp of when the last read ack landed',
        nullable: true,
    })
    lastReadAt: string | null;
}

export class ParticipantStateListResponse {
    @ApiProperty({ type: [ParticipantStateResponse] })
    items: ParticipantStateResponse[];
}
