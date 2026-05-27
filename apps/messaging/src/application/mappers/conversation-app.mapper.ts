import { ConversationEntity } from '@social-chat/domain';

import { ConversationDTO } from '../dtos/conversation.dto';

export class ConversationAppMapper {
    static fromEntityToAppModel(entity: ConversationEntity): ConversationDTO {
        return {
            id: entity.id,
            type: entity.type,
            name: entity.name,
            members: entity.members.map((m) => ({
                userId: m.userId,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            lastActivityAt: entity.lastActivityAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
