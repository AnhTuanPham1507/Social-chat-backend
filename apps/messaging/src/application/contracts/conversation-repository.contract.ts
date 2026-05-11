import { ConversationEntity } from '@social-chat/domain';

export const CONVERSATION_REPO_TOKEN = Symbol('CONVERSATION_REPO_TOKEN');

export interface IConversationRepository {
    insert(conversation: ConversationEntity): Promise<void>;
    findById(id: string): Promise<ConversationEntity | null>;
    findExistingDM(userIdA: string, userIdB: string): Promise<ConversationEntity | null>;
}
