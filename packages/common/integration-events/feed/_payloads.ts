/**
 * Shared payload shapes for feed integration events.
 *
 * Redeclared from the domain snapshots (not imported from `@social-chat/domain`)
 * so consumers in other bounded contexts don't depend on the feed domain package.
 */

export interface PostSnapshotPayload {
    readonly id: string;
    readonly authorId: string;
    readonly content: string;
    readonly visibility: string;
    readonly isEdited: boolean;
    readonly editedAt?: Date;
    readonly originalPostId?: string;
    readonly attachmentKeys: readonly string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}

export interface CommentSnapshotPayload {
    readonly id: string;
    readonly postId: string;
    readonly authorId: string;
    readonly parentCommentId?: string;
    readonly content: string;
    readonly attachments: readonly string[];
    readonly isEdited: boolean;
    readonly editedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
