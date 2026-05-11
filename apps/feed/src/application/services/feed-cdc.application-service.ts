import { Inject, Injectable, Logger } from '@nestjs/common';
import { DebeziumMessage } from '@social-chat/infrastructure';
import {
    POST_READ_REPO_TOKEN,
    IPostReadRepository,
} from '../contracts/post-read-repository.contract';
import {
    POST_SEARCH_REPO_TOKEN,
    IPostSearchRepository,
} from '../contracts/post-search-repository.contract';
import {
    REACTION_READ_REPO_TOKEN,
    IReactionReadRepository,
} from '../contracts/reaction-read-repository.contract';
import {
    USER_READ_REPO_TOKEN,
    IUserReadRepository,
} from '../contracts/user-read-repository.contract';
import {
    COMMENT_READ_REPO_TOKEN,
    ICommentReadRepository,
} from '../contracts/comment-read-repository.contract';

interface CdcPostRow {
    id: string;
    author_id: string;
    content: string | null;
    visibility: string;
    is_edited: boolean;
    edited_at: number | null;
    original_post_id: string | null;
    attachment_keys: string[];
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
}

interface CdcCommentRow {
    id: string;
    post_id: string;
    author_id: string;
    parent_comment_id: string | null;
    content: string;
    attachments: string[];
    is_edited: boolean;
    edited_at: number | null;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
}

interface CdcReactionRow {
    id: string;
    content_id: string;
    content_type: string;
    user_id: string;
    reaction: string;
    created_at: number;
}

export const FEED_CDC_APPLICATION_SERVICE_TOKEN = Symbol('FEED_CDC_APPLICATION_SERVICE_TOKEN');

export interface IFeedCdcApplicationService {
    handlePostChange(message: DebeziumMessage): Promise<void>;
    handleReactionChange(message: DebeziumMessage): Promise<void>;
    handleCommentChange(message: DebeziumMessage): Promise<void>;
}

@Injectable()
export class FeedCdcApplicationService implements IFeedCdcApplicationService {
    private readonly _logger = new Logger(FeedCdcApplicationService.name);

    constructor(
        @Inject(POST_READ_REPO_TOKEN)
        private readonly _postReadRepo: IPostReadRepository,
        @Inject(POST_SEARCH_REPO_TOKEN)
        private readonly _postSearchRepo: IPostSearchRepository,
        @Inject(REACTION_READ_REPO_TOKEN)
        private readonly _reactionReadRepo: IReactionReadRepository,
        @Inject(USER_READ_REPO_TOKEN)
        private readonly _userReadRepo: IUserReadRepository,
        @Inject(COMMENT_READ_REPO_TOKEN)
        private readonly _commentReadRepo: ICommentReadRepository,
    ) {}

    async handlePostChange(message: DebeziumMessage): Promise<void> {
        const { op, before, after } = message as unknown as DebeziumMessage<CdcPostRow>;

        switch (op) {
            case 'c':
            case 'r':
            case 'u': {
                const row = after;

                const user = await this._userReadRepo.findById(row.author_id);
                if (!user) {
                    this._logger.warn(
                        `User ${row.author_id} not found in local read model for post ${row.id}, skipping`,
                    );
                    return;
                }

                await this._postReadRepo.upsertPost(row.id, {
                    authorId: row.author_id,
                    author: {
                        id: user._id,
                        name: user.displayName,
                        avatar: user.avatarUrl,
                    },
                    content: row.content,
                    visibility: row.visibility,
                    isEdited: row.is_edited,
                    editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
                    originalPostId: row.original_post_id,
                    attachmentKeys: row.attachment_keys || [],
                    postCreatedAt: new Date(row.created_at),
                    postUpdatedAt: new Date(row.updated_at),
                    postDeletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
                });

                // Sync to Elasticsearch search index
                if (row.content && !row.deleted_at) {
                    await this._postSearchRepo.indexPost(row.id, {
                        id: row.id,
                        content: row.content,
                        visibility: row.visibility,
                        authorId: row.author_id,
                        createdAt: new Date(row.created_at),
                        updatedAt: new Date(row.updated_at),
                    });
                } else if (row.deleted_at) {
                    await this._postSearchRepo.deletePost(
                        row.id,
                        new Date(row.deleted_at),
                    );
                }

                // Fan out share count changes onto the original post.
                if (op === 'c' || op === 'r') {
                    if (row.original_post_id) {
                        await this._postReadRepo.incrementSharesCount(row.original_post_id, 1);
                    }
                } else if (op === 'u' && before) {
                    const wasSoftDeleted = !before.deleted_at && row.deleted_at;
                    if (wasSoftDeleted && before.original_post_id) {
                        await this._postReadRepo.incrementSharesCount(before.original_post_id, -1);
                    }
                }
                break;
            }
            case 'd': {
                const row = before;
                await this._postReadRepo.deletePost(row.id);
                await this._postSearchRepo.deletePost(row.id);
                if (row.original_post_id) {
                    await this._postReadRepo.incrementSharesCount(row.original_post_id, -1);
                }
                break;
            }
        }
    }

    async handleReactionChange(message: DebeziumMessage): Promise<void> {
        const { op, before, after } = message as unknown as DebeziumMessage<CdcReactionRow>;

        switch (op) {
            case 'c':
            case 'r': {
                if (after.content_type === 'POST') {
                    await this._postReadRepo.incrementReactionCount(
                        after.content_id,
                        after.reaction,
                        1,
                    );
                } else if (after.content_type === 'COMMENT') {
                    await this._commentReadRepo.incrementReactionCount(
                        after.content_id,
                        after.reaction,
                        1,
                    );
                }
                await this._upsertReactionReadModel(after);
                break;
            }
            case 'd': {
                if (before.content_type === 'POST') {
                    await this._postReadRepo.incrementReactionCount(
                        before.content_id,
                        before.reaction,
                        -1,
                    );
                } else if (before.content_type === 'COMMENT') {
                    await this._commentReadRepo.incrementReactionCount(
                        before.content_id,
                        before.reaction,
                        -1,
                    );
                }
                await this._reactionReadRepo.deleteReaction(before.id);
                break;
            }
            case 'u': {
                if (after.content_type === 'POST') {
                    await this._postReadRepo.changeReactionCount(
                        after.content_id,
                        before.reaction,
                        after.reaction,
                    );
                } else if (after.content_type === 'COMMENT') {
                    await this._commentReadRepo.changeReactionCount(
                        after.content_id,
                        before.reaction,
                        after.reaction,
                    );
                }
                await this._upsertReactionReadModel(after);
                break;
            }
        }
    }

    async handleCommentChange(message: DebeziumMessage): Promise<void> {
        const { op, before, after } = message as unknown as DebeziumMessage<CdcCommentRow>;

        switch (op) {
            case 'c':
            case 'r': {
                await this._upsertCommentReadModel(after);
                await this._postReadRepo.incrementCommentsCount(after.post_id, 1);
                if (after.parent_comment_id) {
                    await this._commentReadRepo.incrementRepliesCount(after.parent_comment_id, 1);
                }
                break;
            }
            case 'u': {
                await this._upsertCommentReadModel(after);
                const wasSoftDeleted = !before.deleted_at && after.deleted_at;
                if (wasSoftDeleted) {
                    await this._postReadRepo.incrementCommentsCount(after.post_id, -1);
                    if (after.parent_comment_id) {
                        await this._commentReadRepo.incrementRepliesCount(after.parent_comment_id, -1);
                    }
                }
                break;
            }
            case 'd': {
                await this._commentReadRepo.deleteComment(before.id);
                await this._postReadRepo.incrementCommentsCount(before.post_id, -1);
                if (before.parent_comment_id) {
                    await this._commentReadRepo.incrementRepliesCount(before.parent_comment_id, -1);
                }
                break;
            }
        }
    }

    private async _upsertCommentReadModel(row: CdcCommentRow): Promise<void> {
        const user = await this._userReadRepo.findById(row.author_id);

        if (!user) {
            this._logger.warn(`User ${row.author_id} not found in local read model for comment ${row.id}, skipping`);
            return;
        }

        await this._commentReadRepo.upsertComment(row.id, {
            postId: row.post_id,
            parentCommentId: row.parent_comment_id ?? undefined,
            author: {
                id: user._id,
                name: user.displayName,
                avatar: user.avatarUrl,
            },
            content: row.content,
            attachments: row.attachments || [],
            isEdited: row.is_edited,
            editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
            commentCreatedAt: new Date(row.created_at),
            commentUpdatedAt: new Date(row.updated_at),
            commentDeletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
        });
    }

    private async _upsertReactionReadModel(row: CdcReactionRow): Promise<void> {
        const user = await this._userReadRepo.findById(row.user_id);

        if (!user) {
            this._logger.warn(`User ${row.user_id} not found in local read model for reaction ${row.id}, skipping`);
            return;
        }

        await this._reactionReadRepo.upsertReaction(row.id, {
            contentId: row.content_id,
            contentType: row.content_type,
            reaction: row.reaction,
            author: {
                id: user._id,
                name: user.displayName,
                avatar: user.avatarUrl,
            },
            reactionCreatedAt: new Date(row.created_at),
        });
    }
}
