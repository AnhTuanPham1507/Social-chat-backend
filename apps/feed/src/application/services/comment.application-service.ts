import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommentEntity, CONTENT_TYPE, DOMAIN_EVENT_BUS_TOKEN, IDomainEventBus } from '@social-chat/domain';
import { Comment, CreateCommentInput, EditCommentInput } from '../dtos/comment.dto';
import { ICommentRepository, COMMENT_REPO_TOKEN } from '../contracts/comment-repository.contract';
import { IPostRepository, POST_REPO_TOKEN } from '../contracts/post-repository.contract';
import { IReactionRepository, REACTION_REPO_TOKEN } from '../contracts/reaction-repository.contract';
import { CommentAppMapper } from '../mappers/comment-app.mapper';

export const COMMENT_APPLICATION_SERVICE_TOKEN = Symbol('COMMENT_APPLICATION_SERVICE_TOKEN');

export interface ICommentApplicationService {
    createComment(userId: string, postId: string, input: CreateCommentInput): Promise<Comment>;
    editComment(userId: string, commentId: string, input: EditCommentInput): Promise<Comment>;
    deleteComment(userId: string, commentId: string): Promise<void>;
}

@Injectable()
export class CommentApplicationService implements ICommentApplicationService {
    constructor(
        @Inject(COMMENT_REPO_TOKEN)
        private readonly _commentRepo: ICommentRepository,
        @Inject(POST_REPO_TOKEN)
        private readonly _postRepo: IPostRepository,
        @Inject(REACTION_REPO_TOKEN)
        private readonly _reactionRepo: IReactionRepository,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
    ) {}

    public async createComment(userId: string, postId: string, input: CreateCommentInput): Promise<Comment> {
        const post = await this._postRepo.findById(postId);
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (input.parentCommentId) {
            const parentComment = await this._commentRepo.findById(input.parentCommentId);
            if (!parentComment) {
                throw new NotFoundException('Parent comment not found');
            }
            if (parentComment.postId !== postId) {
                throw new NotFoundException('Parent comment does not belong to this post');
            }
            if (parentComment.isReply) {
                throw new ForbiddenException('Cannot reply to a reply');
            }
        }

        const comment = CommentEntity.create({
            postId,
            authorId: userId,
            parentCommentId: input.parentCommentId,
            content: input.content,
            attachments: input.attachments,
        });

        await this._commentRepo.insert(comment);

        const events = comment.publishEvents();
        await this._domainEventBus.publishAll(events);

        return CommentAppMapper.fromEntityToAppModel(comment);
    }

    public async editComment(userId: string, commentId: string, input: EditCommentInput): Promise<Comment> {
        const comment = await this._commentRepo.findById(commentId);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.authorId !== userId) {
            throw new ForbiddenException('You can only edit your own comments');
        }

        comment.edit(input.content, input.attachments);
        await this._commentRepo.update(comment);

        const events = comment.publishEvents();
        await this._domainEventBus.publishAll(events);

        return CommentAppMapper.fromEntityToAppModel(comment);
    }

    public async deleteComment(userId: string, commentId: string): Promise<void> {
        const comment = await this._commentRepo.findById(commentId);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.authorId !== userId) {
            throw new ForbiddenException('You can only delete your own comments');
        }

        // Delete reactions on this comment
        await this._reactionRepo.deleteByContentId(commentId, CONTENT_TYPE.COMMENT);

        comment.delete();
        await this._commentRepo.softDelete(commentId);

        const events = comment.publishEvents();
        await this._domainEventBus.publishAll(events);
    }
}
