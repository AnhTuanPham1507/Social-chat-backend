import { MessageEntity } from '@social-chat/domain';
import { Message } from '@social-chat/infrastructure';

export class MessagePersistenceMapper {
    static fromEntityToDoc(entity: MessageEntity): Message {
        return {
            _id: entity.id,
            conversationId: entity.conversationId,
            senderId: entity.senderId,
            content: entity.content,
            attachmentKeys: entity.attachmentKeys,
            serverTs: entity.serverTs,
        };
    }

    static fromDocToEntity(doc: Message): MessageEntity {
        return MessageEntity.reconstitute({
            id: doc._id,
            conversationId: doc.conversationId,
            senderId: doc.senderId,
            content: doc.content,
            attachmentKeys: doc.attachmentKeys ?? [],
            serverTs: doc.serverTs,
        });
    }
}
