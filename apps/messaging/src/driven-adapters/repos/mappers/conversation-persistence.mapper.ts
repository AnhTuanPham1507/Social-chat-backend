import {
    CONVERSATION_TYPE,
    ConversationEntity,
    Membership,
    PARTICIPANT_ROLE,
} from '@social-chat/domain';
import { ConversationMemberModel, ConversationModel } from '@social-chat/infrastructure';

export class ConversationPersistenceMapper {
    static fromEntityToModel(entity: ConversationEntity): Partial<ConversationModel> {
        const memberIds = entity.memberIds();
        const isDM = entity.isDM;

        let lowerUserId: string | null = null;
        let higherUserId: string | null = null;
        if (isDM && memberIds.length === 2) {
            const [a, b] = [...memberIds].sort();
            lowerUserId = a;
            higherUserId = b;
        }

        const members: Partial<ConversationMemberModel>[] = entity.members.map((m) => ({
            conversationId: entity.id,
            userId: m.userId,
            role: m.role,
            joinedAt: m.joinedAt,
        }));

        return {
            id: entity.id,
            type: entity.type,
            name: entity.name,
            lowerUserId,
            higherUserId,
            lastActivityAt: entity.lastActivityAt,
            members: members as ConversationMemberModel[],
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }

    static fromModelToEntity(model: ConversationModel): ConversationEntity {
        const members = (model.members ?? []).map(
            (m) => new Membership(m.userId, m.role as PARTICIPANT_ROLE, m.joinedAt),
        );

        return ConversationEntity.reconstitute({
            id: model.id,
            type: model.type as CONVERSATION_TYPE,
            name: model.name,
            members,
            lastActivityAt: model.lastActivityAt,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }
}
