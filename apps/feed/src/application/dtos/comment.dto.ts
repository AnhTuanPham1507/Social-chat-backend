export class Comment {
    id: string;
    postId: string;
    authorId: string;
    parentCommentId?: string;
    content: string;
    attachments: string[];
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export class CommentReadDTO {
    id: string;
    postId: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    parentCommentId?: string;
    content: string;
    attachments: string[];
    isEdited: boolean;
    editedAt?: Date;
    reactionCounts: {
        like: number;
        love: number;
        haha: number;
        wow: number;
        sad: number;
        angry: number;
    };
    repliesCount: number;
    myReaction: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCommentInput {
    content: string;
    parentCommentId?: string;
    attachments?: string[];
}

export interface EditCommentInput {
    content: string;
    attachments?: string[];
}
