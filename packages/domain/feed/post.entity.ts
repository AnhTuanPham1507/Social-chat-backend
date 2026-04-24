import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { POST_VISIBILITY } from '../post/post-visibility.enum';
import { PostContent } from './post-content.value-object';
import { PostCreatedEvent } from './events/post-created.event';
import { PostUpdatedEvent } from './events/post-updated.event';
import { PostDeletedEvent } from './events/post-deleted.event';
import { PostSharedEvent } from './events/post-shared.event';
import { PostSnapshot } from './post-snapshot';

interface PostProps {
  authorId: string;
  content: PostContent;
  visibility: POST_VISIBILITY;
  isEdited: boolean;
  editedAt?: Date;
  originalPostId?: string;
  attachmentKeys: string[];
}

export interface CreatePostProps {
  authorId: string;
  content?: string;
  visibility?: POST_VISIBILITY;
  attachmentKeys?: string[];
}

export interface SharePostProps {
  sharerId: string;
  originalPost: PostEntity;
  comment?: string;
  visibility?: POST_VISIBILITY;
}

export interface ReconstitutePostProps {
  id: UUID;
  authorId: string;
  content?: string;
  visibility: POST_VISIBILITY;
  isEdited: boolean;
  editedAt?: Date;
  originalPostId?: string;
  attachmentKeys: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class PostEntity extends AggregateRoot<PostProps> {
  // ============================================
  // Factory Methods
  // ============================================

  private constructor(props: PostProps, id?: UUID) {
    super(props, id);
  }

  static create(props: CreatePostProps): PostEntity {
    PostEntity.validateComposition({
      content: props.content,
      attachmentKeys: props.attachmentKeys,
      originalPostId: undefined,
    });

    const postProps: PostProps = {
      authorId: props.authorId,
      content: PostContent.fromString(props.content),
      visibility: props.visibility ?? POST_VISIBILITY.PUBLIC,
      isEdited: false,
      originalPostId: undefined,
      attachmentKeys: props.attachmentKeys ?? [],
    };

    const post = new PostEntity(postProps);

    post.addDomainEvent(
      new PostCreatedEvent(post.id, post.authorId, post.visibility),
    );

    return post;
  }

  static share(props: SharePostProps): PostEntity {
    const { sharerId, originalPost, comment, visibility } = props;

    // ----- Invariants on the original post -----
    if (originalPost.isDeleted) {
      throw new BadRequestException('Cannot share a deleted post');
    }

    if (originalPost.visibility === POST_VISIBILITY.PRIVATE) {
      throw new ForbiddenException('Cannot share a private post');
    }

    // ----- Flatten the chain: shares always point to the root -----
    const rootId = originalPost.isShared
      ? (originalPost.originalPostId as string)
      : originalPost.id;

    // ----- Composition check (share-only and content+share are valid) -----
    PostEntity.validateComposition({
      content: comment,
      attachmentKeys: [],
      originalPostId: rootId,
    });

    const postProps: PostProps = {
      authorId: sharerId,
      content: PostContent.fromString(comment),
      visibility: visibility ?? POST_VISIBILITY.PUBLIC,
      isEdited: false,
      originalPostId: rootId,
      attachmentKeys: [],
    };

    console.log('postProps', postProps);

    const sharePost = new PostEntity(postProps);

    sharePost.addDomainEvent(
      new PostSharedEvent(
        sharePost.id,
        sharePost.authorId,
        rootId,
        originalPost.authorId,
        sharePost.visibility,
      ),
    );

    return sharePost;
  }

  static reconstitute(props: ReconstitutePostProps): PostEntity {
    const postProps: PostProps = {
      authorId: props.authorId,
      content: PostContent.fromString(props.content),
      visibility: props.visibility,
      isEdited: props.isEdited,
      editedAt: props.editedAt,
      originalPostId: props.originalPostId,
      attachmentKeys: props.attachmentKeys,
    };

    const post = new PostEntity(postProps, props.id);
    post.setTimestamps(props.createdAt, props.updatedAt, props.deletedAt);

    return post;
  }

  // ============================================
  // Composition invariant
  // ============================================

  /**
   * A valid post must contain at least one of: content, attachments, or a share reference.
   * Shares cannot carry separate attachments — the original post IS the media payload.
   *
   * Allowed shapes:
   *   - content only
   *   - attachments only
   *   - share only
   *   - content + attachments
   *   - content + share
   */
  private static validateComposition(input: {
    content?: string;
    attachmentKeys?: string[];
    originalPostId?: string;
  }): void {
    const hasContent =
      input.content !== undefined && input.content.trim().length > 0;
    const hasAttachments = (input.attachmentKeys?.length ?? 0) > 0;
    const isShare = input.originalPostId !== undefined;

    if (!hasContent && !hasAttachments && !isShare) {
      throw new BadRequestException(
        'Post must have content, attachments, or be a share',
      );
    }

    if (isShare && hasAttachments) {
      throw new BadRequestException(
        'A shared post cannot have separate attachments',
      );
    }
  }

  private assertValidComposition(): void {
    PostEntity.validateComposition({
      content: this._props.content.value,
      attachmentKeys: this._props.attachmentKeys,
      originalPostId: this._props.originalPostId,
    });
  }

  // ============================================
  // Getters
  // ============================================

  get authorId(): string {
    return this._props.authorId;
  }

  get content(): PostContent {
    return this._props.content;
  }

  get visibility(): POST_VISIBILITY {
    return this._props.visibility;
  }

  get isEdited(): boolean {
    return this._props.isEdited;
  }

  get editedAt(): Date | undefined {
    return this._props.editedAt;
  }

  get originalPostId(): string | undefined {
    return this._props.originalPostId;
  }

  get attachmentKeys(): string[] {
    return [...this._props.attachmentKeys];
  }

  get isShared(): boolean {
    return !!this._props.originalPostId;
  }

  // ============================================
  // Behavior Methods
  // ============================================

  updateContent(newContent: string): void {
    this._props.content = PostContent.fromString(newContent);
    this._props.isEdited = true;
    this._props.editedAt = new Date();
    this.assertValidComposition();
    this.markAsUpdated();
    this.addDomainEvent(new PostUpdatedEvent(this.id, ['content']));
  }

  updateVisibility(newVisibility: POST_VISIBILITY): void {
    if (this._props.visibility === newVisibility) {
      return;
    }

    this._props.visibility = newVisibility;
    this.markAsUpdated();
    this.addDomainEvent(new PostUpdatedEvent(this.id, ['visibility']));
  }

  updatePost(updates: {
    content?: string;
    visibility?: POST_VISIBILITY;
    attachmentKeys?: string[];
  }): void {
    const changedFields: string[] = [];

    if (updates.content !== undefined) {
      this._props.content = PostContent.fromString(updates.content);
      this._props.isEdited = true;
      this._props.editedAt = new Date();
      changedFields.push('content');
    }

    if (
      updates.visibility !== undefined &&
      this._props.visibility !== updates.visibility
    ) {
      this._props.visibility = updates.visibility;
      changedFields.push('visibility');
    }

    if (updates.attachmentKeys !== undefined) {
      this._props.attachmentKeys = updates.attachmentKeys;
      changedFields.push('attachmentKeys');
    }

    if (changedFields.length > 0) {
      this.assertValidComposition();
      this.markAsUpdated();
      this.addDomainEvent(new PostUpdatedEvent(this.id, changedFields));
    }
  }

  delete(): void {
    if (this.isDeleted) {
      return;
    }
    this.markAsDeleted();

    this.addDomainEvent(new PostDeletedEvent(this.toSnapshot()));
  }

  toSnapshot(): PostSnapshot {
    return {
      id: this._id,
      authorId: this._props.authorId,
      content: this._props.content.value,
      visibility: this._props.visibility,
      isEdited: this._props.isEdited,
      editedAt: this._props.editedAt,
      originalPostId: this._props.originalPostId,
      attachmentKeys: [...this._props.attachmentKeys],
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
