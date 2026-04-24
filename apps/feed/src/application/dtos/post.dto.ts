import { POST_VISIBILITY, REACTION_TYPE } from '@social-chat/domain';

export interface ReactionCountsMap {
    like: number;
    love: number;
    haha: number;
    wow: number;
    sad: number;
    angry: number;
}

export interface PostReactions {
    counts: ReactionCountsMap;
    mine: REACTION_TYPE | null;
}

export interface SharedOriginalAuthorDTO {
    id: string;
    displayName: string;
    avatarUrl?: string;
}

export interface SharedOriginalDTO {
    id: string;
    isAvailable: boolean;
    /**
     * Author of the original post. Always populated when the original
     * still exists in the read model — even on tombstones — so the UI
     * can render "Bob's post is unavailable".
     */
    author?: SharedOriginalAuthorDTO;
    /** Only populated when isAvailable=true */
    content?: string;
    attachmentKeys?: string[];
    visibility?: POST_VISIBILITY;
    createdAt?: Date;
}

export class PostDTO {
    id?: string;
    authorId: string;
    content?: string;
    visibility: POST_VISIBILITY;
    isEdited: boolean;
    editedAt?: Date;
    originalPostId?: string;
    attachmentKeys: string[];
    reactions: PostReactions;
    totalCommentsCount: number;
    totalSharesCount: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    /** Populated only when this post is a share */
    originalPost?: SharedOriginalDTO;
}

export interface CreatePostInput {
    content?: string;
    visibility?: POST_VISIBILITY;
    attachmentKeys?: string[];
}

export interface UpdatePostInput {
    content?: string;
    visibility?: POST_VISIBILITY;
    attachmentKeys?: string[];
}

export interface SharePostInput {
    comment?: string;
    visibility?: POST_VISIBILITY;
}
