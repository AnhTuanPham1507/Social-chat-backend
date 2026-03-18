import { POST_VISIBILITY } from '@social-chat/domain';

export class Post {
    id?: string;
    authorId: string;
    content?: string;
    visibility: POST_VISIBILITY;
    isEdited: boolean;
    editedAt?: Date;
    originalPostId?: string;
    reactionsCount: number;
    commentsCount: number;
    sharesCount: number;
    attachmentKeys: string[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export interface CreatePostInput {
    content?: string;
    visibility?: POST_VISIBILITY;
    attachmentKeys?: string[];
}

export interface UpdatePostInput {
    content?: string;
    visibility?: POST_VISIBILITY;
}
