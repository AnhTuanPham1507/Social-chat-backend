import { POST_VISIBILITY } from '../post/post-visibility.enum';

/**
 * Frozen data representation of a PostEntity.
 *
 * Domain events carry snapshots rather than entity references so they remain
 * immutable value objects — safe to serialize, log, replay, or persist without
 * dragging class methods or ORM metadata across boundaries.
 */
export interface PostSnapshot {
  readonly id: string;
  readonly authorId: string;
  readonly content: string;
  readonly visibility: POST_VISIBILITY;
  readonly isEdited: boolean;
  readonly editedAt?: Date;
  readonly originalPostId?: string;
  readonly attachmentKeys: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}
