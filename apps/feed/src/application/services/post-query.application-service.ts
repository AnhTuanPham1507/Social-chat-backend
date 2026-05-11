import { Inject, Injectable } from '@nestjs/common';
import { PostDTO, SharedOriginalDTO } from '../dtos/post.dto';
import { POST_READ_REPO_TOKEN, PostReadModel, IPostReadRepository } from '../contracts/post-read-repository.contract';
import {
    CursorPaginatedResult,
    IReactionReadRepository,
    ReactionReadModel,
    REACTION_READ_REPO_TOKEN,
} from '../contracts/reaction-read-repository.contract';
import { CONTENT_TYPE, POST_VISIBILITY, REACTION_TYPE } from '@social-chat/domain';
import { IReactionRepository, REACTION_REPO_TOKEN } from '../contracts/reaction-repository.contract';

export const POST_QUERY_APPLICATION_SERVICE_TOKEN = Symbol('POST_QUERY_APPLICATION_SERVICE_TOKEN');

export interface IPostQueryApplicationService {
    getPostsByAuthor(userId: string, authorId: string, page: number, limit: number): Promise<PostDTO[]>;
    getFeed(userId: string, limit: number, cursor?: string): Promise<CursorPaginatedResult<PostDTO>>;
    getReactionsByPostId(
        postId: string,
        limit: number,
        cursor?: string,
        reactionType?: string,
    ): Promise<CursorPaginatedResult<ReactionReadModel>>;
    /**
     * Bulk enrich posts by IDs into full DTOs (with reactions, comments,
     * shared original, etc.) preserving the input order. Used by search
     * to hydrate ES-ranked IDs without duplicating enrichment logic.
     */
    getPostsByIds(userId: string, ids: string[]): Promise<PostDTO[]>;
}

@Injectable()
export class PostQueryApplicationService implements IPostQueryApplicationService {
    constructor(
        @Inject(POST_READ_REPO_TOKEN)
        private readonly _postReadRepo: IPostReadRepository,
        @Inject(REACTION_REPO_TOKEN)
        private readonly _reactionRepo: IReactionRepository,
        @Inject(REACTION_READ_REPO_TOKEN)
        private readonly _reactionReadRepo: IReactionReadRepository,
    ) {}

    async getPostsByAuthor(userId: string, authorId: string, page: number, limit: number): Promise<PostDTO[]> {
        const docs = await this._postReadRepo.findByAuthorId(authorId, page, limit);
        return this.enrichWithMyReactions(docs, userId);
    }

    async getPostsByIds(userId: string, ids: string[]): Promise<PostDTO[]> {
        if (ids.length === 0) return [];

        const docs = await this._postReadRepo.findManyByIds(ids);

        // Preserve the caller's ranked order — Mongo $in doesn't guarantee it
        // and the search service depends on ES ranking being preserved.
        const docMap = new Map(docs.map((d) => [d._id, d]));
        const orderedDocs = ids
            .map((id) => docMap.get(id))
            .filter((d): d is PostReadModel => d !== undefined);

        return this.enrichWithMyReactions(orderedDocs, userId);
    }

    async getFeed(
        userId: string,
        limit: number,
        cursor?: string,
    ): Promise<CursorPaginatedResult<PostDTO>> {
        const result = await this._postReadRepo.findFeedWithCursor(limit, cursor);
        const items = await this.enrichWithMyReactions(result.items, userId);
        return {
            items,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }

    private async enrichWithMyReactions(
        docs: PostReadModel[],
        userId: string,
    ): Promise<PostDTO[]> {
        if (docs.length === 0) {
            return [];
        }

        const postIds = docs.map((doc) => doc._id);
        const myReactions = await this._reactionRepo.findByContentIdsAndUserId(postIds, CONTENT_TYPE.POST, userId);

        return docs.map((doc) => this.toAppModel(doc, myReactions.get(doc._id) ?? null));
    }

    async getReactionsByPostId(
        postId: string,
        limit: number,
        cursor?: string,
        reactionType?: string,
    ): Promise<CursorPaginatedResult<ReactionReadModel>> {
        return this._reactionReadRepo.findByContentIdWithCursor(postId, 'POST', limit, cursor, reactionType);
    }

    private toAppModel(doc: PostReadModel, myReaction: REACTION_TYPE | null): PostDTO {
        return {
            id: doc._id,
            authorId: doc.authorId,
            author: doc.author
                ? {
                      id: doc.author.id,
                      name: doc.author.name,
                      avatar: doc.author.avatar,
                  }
                : undefined,
            content: doc.content,
            visibility: doc.visibility as POST_VISIBILITY,
            isEdited: doc.isEdited,
            editedAt: doc.editedAt,
            originalPostId: doc.originalPostId,
            attachmentKeys: doc.attachmentKeys,
            reactions: {
                counts: doc.reactionCounts,
                mine: myReaction,
            },
            totalCommentsCount: doc.totalCommentsCount ?? 0,
            totalSharesCount: doc.totalSharesCount ?? 0,
            createdAt: doc.postCreatedAt,
            updatedAt: doc.postUpdatedAt,
            deletedAt: doc.postDeletedAt,
            originalPost: this.toSharedOriginal(doc),
        };
    }

    /**
     * Maps the $lookup'd original post into a share-friendly DTO,
     * applying tombstone rules. Strips content/attachments when the
     * original is deleted or PRIVATE — never leak hidden data.
     *
     * Author is preserved on tombstones so the UI can render
     * "Bob's post is unavailable" — author identity isn't private.
     *
     * TODO: FRIENDS-visible originals should also be tombstoned for
     * non-friends of the original author. Requires a friendship lookup
     * keyed on the current viewer.
     */
    private toSharedOriginal(doc: PostReadModel): SharedOriginalDTO | undefined {
        // Not a share — nothing to embed.
        if (!doc.originalPostId) {
            return undefined;
        }

        // Share whose original was hard-deleted (no $lookup match at all).
        if (!doc.originalPost) {
            return { id: doc.originalPostId, isAvailable: false };
        }

        const original = doc.originalPost;
        const author = doc.originalPostAuthor
            ? {
                  id: doc.originalPostAuthor._id,
                  displayName: doc.originalPostAuthor.displayName,
                  avatarUrl: doc.originalPostAuthor.avatarUrl,
              }
            : undefined;

        const isHidden =
            original.postDeletedAt !== null && original.postDeletedAt !== undefined;
        const isPrivate = original.visibility === POST_VISIBILITY.PRIVATE;

        if (isHidden || isPrivate) {
            return { id: original._id, isAvailable: false, author };
        }

        return {
            id: original._id,
            isAvailable: true,
            author,
            content: original.content,
            attachmentKeys: original.attachmentKeys ?? [],
            visibility: original.visibility as POST_VISIBILITY,
            createdAt: original.postCreatedAt,
        };
    }
}
