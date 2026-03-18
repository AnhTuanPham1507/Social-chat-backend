import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { POST_VISIBILITY } from '../post/post-visibility.enum';
import { PostContent } from './post-content.value-object';
import { PostCreatedEvent } from './events/post-created.event';
import { PostUpdatedEvent } from './events/post-updated.event';
import { PostDeletedEvent } from './events/post-deleted.event';

interface PostProps {
  authorId: string;
  content: PostContent;
  visibility: POST_VISIBILITY;
  isEdited: boolean;
  editedAt?: Date;
  originalPostId?: string;
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
  attachmentKeys: string[];
}

export interface CreatePostProps {
  authorId: string;
  content?: string;
  visibility?: POST_VISIBILITY;
  originalPostId?: string;
  attachmentKeys?: string[];
}

export interface ReconstitutePostProps {
  id: UUID;
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
    const postProps: PostProps = {
      authorId: props.authorId,
      content: PostContent.fromString(props.content),
      visibility: props.visibility ?? POST_VISIBILITY.PUBLIC,
      isEdited: false,
      originalPostId: props.originalPostId,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      attachmentKeys: props.attachmentKeys ?? [],
    };

    const post = new PostEntity(postProps);

    post.addDomainEvent(
      new PostCreatedEvent(post.id, post.authorId, post.visibility),
    );

    return post;
  }

  static reconstitute(props: ReconstitutePostProps): PostEntity {
    const postProps: PostProps = {
      authorId: props.authorId,
      content: PostContent.fromString(props.content),
      visibility: props.visibility,
      isEdited: props.isEdited,
      editedAt: props.editedAt,
      originalPostId: props.originalPostId,
      reactionsCount: props.reactionsCount,
      commentsCount: props.commentsCount,
      sharesCount: props.sharesCount,
      attachmentKeys: props.attachmentKeys,
    };

    const post = new PostEntity(postProps, props.id);
    post.setTimestamps(props.createdAt, props.updatedAt, props.deletedAt);

    return post;
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

  get reactionsCount(): number {
    return this._props.reactionsCount;
  }

  get commentsCount(): number {
    return this._props.commentsCount;
  }

  get sharesCount(): number {
    return this._props.sharesCount;
  }

  get attachmentKeys(): string[] {
    return [...this._props.attachmentKeys];
  }

  get isShared(): boolean {
    return this._props.originalPostId !== undefined;
  }

  // ============================================
  // Behavior Methods
  // ============================================

  updateContent(newContent: string): void {
    this._props.content = PostContent.fromString(newContent);
    this._props.isEdited = true;
    this._props.editedAt = new Date();
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

    if (changedFields.length > 0) {
      this.markAsUpdated();
      this.addDomainEvent(new PostUpdatedEvent(this.id, changedFields));
    }
  }

  delete(): void {
    if (this.isDeleted) {
      return;
    }
    this.markAsDeleted();
    this.addDomainEvent(new PostDeletedEvent(this.id, this.authorId));
  }
}
