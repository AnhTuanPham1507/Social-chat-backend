import { MessageEntity } from '@social-chat/domain';

import { MessageDTO } from '../dtos/message.dto';

export class MessageAppMapper {
    static fromEntityToAppModel(entity: MessageEntity): MessageDTO {
        return {
            id: entity.id,
            conversationId: entity.conversationId,
            senderId: entity.senderId,
            content: entity.content,
            attachmentKeys: entity.attachmentKeys,
            serverTs: entity.serverTs,
        };
    }
}
