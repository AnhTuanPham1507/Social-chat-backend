import { CONTENT_TYPE, REACTION_TYPE, ReactionEntity } from '@social-chat/domain';

export const REACTION_REPO_TOKEN = Symbol('REACTION_REPO_TOKEN');

export interface IReactionRepository {
    insert(reaction: ReactionEntity): Promise<void>;
    update(reaction: ReactionEntity): Promise<void>;
    delete(id: string): Promise<void>;
    deleteByContentId(contentId: string, contentType: CONTENT_TYPE): Promise<void>;
    deleteByContentIds(contentIds: string[], contentType: CONTENT_TYPE): Promise<void>;
    findById(id: string): Promise<ReactionEntity | null>;
    findByContentIdAndUserId(contentId: string, contentType: CONTENT_TYPE, userId: string): Promise<ReactionEntity | null>;
    findByContentId(contentId: string, contentType: CONTENT_TYPE, page: number, limit: number): Promise<ReactionEntity[]>;
    countByContentId(contentId: string, contentType: CONTENT_TYPE): Promise<number>;
    findByContentIdsAndUserId(
        contentIds: string[],
        contentType: CONTENT_TYPE,
        userId: string,
    ): Promise<Map<string, REACTION_TYPE>>;
}
