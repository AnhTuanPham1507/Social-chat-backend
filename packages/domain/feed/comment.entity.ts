import { BadRequestException } from '@nestjs/common';
import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { CommentContent } from './comment-content.value-object';
import { CommentCreatedEvent } from './events/comment-created.event';
import { CommentEditedEvent } from './events/comment-edited.event';
import { CommentDeletedEvent } from './events/comment-deleted.event';
import { CommentSnapshot } from './comment-snapshot';

interface CommentProps {
  postId: string;
  authorId: string;
  parentCommentId?: string;
  content: CommentContent;
  attachments: string[];
  isEdited: boolean;
  editedAt?: Date;
}

export interface CreateCommentProps {
  postId: string;
  authorId: string;
  parentCommentId?: string;
  content: string;
  attachments?: string[];
}

export interface ReconstituteCommentProps {
  id: UUID;
  postId: string;
  authorId: string;
  parentCommentId?: string;
  content: string;
  attachments: string[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class CommentEntity extends AggregateRoot<CommentProps> {
  // ============================================
  // Factory Methods
  // ============================================

  private constructor(props: CommentProps, id?: UUID) {
    super(props, id);
  }

  static create(props: CreateCommentProps): CommentEntity {
    const hasContent = props.content && props.content.trim().length > 0;
    const hasAttachments = props.attachments && props.attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      throw new BadRequestException('Comment must have content or attachments');
    }

    const comment = new CommentEntity({
      postId: props.postId,
      authorId: props.authorId,
      parentCommentId: props.parentCommentId,
      content: CommentContent.fromString(props.content),
      attachments: props.attachments ?? [],
      isEdited: false,
    });

    comment.addDomainEvent(
      new CommentCreatedEvent(
        comment.id,
        props.postId,
        props.authorId,
        props.parentCommentId,
      ),
    );

    return comment;
  }

  static reconstitute(props: ReconstituteCommentProps): CommentEntity {
    const comment = new CommentEntity(
      {
        postId: props.postId,
        authorId: props.authorId,
        parentCommentId: props.parentCommentId,
        content: CommentContent.fromString(props.content),
        attachments: props.attachments,
        isEdited: props.isEdited,
        editedAt: props.editedAt,
      },
      props.id,
    );
    comment.setTimestamps(props.createdAt, props.updatedAt, props.deletedAt);

    return comment;
  }

  // ============================================
  // Getters
  // ============================================

  get postId(): string {
    return this._props.postId;
  }

  get authorId(): string {
    return this._props.authorId;
  }

  get parentCommentId(): string | undefined {
    return this._props.parentCommentId;
  }

  get content(): CommentContent {
    return this._props.content;
  }

  get attachments(): string[] {
    return [...this._props.attachments];
  }

  get isEdited(): boolean {
    return this._props.isEdited;
  }

  get editedAt(): Date | undefined {
    return this._props.editedAt;
  }

  get isReply(): boolean {
    return this._props.parentCommentId != null;
  }

  // ============================================
  // Behavior Methods
  // ============================================

  edit(newContent: string, newAttachments?: string[]): void {
    const content = CommentContent.fromString(newContent);
    const attachments = newAttachments ?? this._props.attachments;

    const hasContent = content.value.length > 0;
    const hasAttachments = attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      throw new BadRequestException('Comment must have content or attachments');
    }

    this._props.content = content;
    this._props.attachments = attachments;
    this._props.isEdited = true;
    this._props.editedAt = new Date();
    this.markAsUpdated();

    this.addDomainEvent(
      new CommentEditedEvent(this.id, this.postId, this.authorId),
    );
  }

  delete(): void {
    if (this.isDeleted) {
      return;
    }
    this.markAsDeleted();

    this.addDomainEvent(new CommentDeletedEvent(this.toSnapshot()));
  }

  toSnapshot(): CommentSnapshot {
    return {
      id: this._id,
      postId: this._props.postId,
      authorId: this._props.authorId,
      parentCommentId: this._props.parentCommentId,
      content: this._props.content.value,
      attachments: [...this._props.attachments],
      isEdited: this._props.isEdited,
      editedAt: this._props.editedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
