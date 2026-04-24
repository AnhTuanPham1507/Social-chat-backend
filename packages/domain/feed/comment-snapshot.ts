/**
 * Frozen data representation of a CommentEntity.
 *
 * Used both as payload inside CommentDeletedEvent and as `cascadedCommentSnapshots`
 * items on PostDeletedIntegrationEvent when a post deletion cascades to its comments.
 */
export interface CommentSnapshot {
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
