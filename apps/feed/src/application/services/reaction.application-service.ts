import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPE, DOMAIN_EVENT_BUS_TOKEN, IDomainEventBus, ReactionEntity } from '@social-chat/domain';
import { Reaction, ReactToPostInput } from '../dtos/reaction.dto';
import { IReactionRepository, REACTION_REPO_TOKEN } from '../contracts/reaction-repository.contract';
import { IPostRepository, POST_REPO_TOKEN } from '../contracts/post-repository.contract';
import { ICommentRepository, COMMENT_REPO_TOKEN } from '../contracts/comment-repository.contract';
import { ReactionAppMapper } from '../mappers/reaction-app.mapper';

export const REACTION_APPLICATION_SERVICE_TOKEN = Symbol('REACTION_APPLICATION_SERVICE_TOKEN');

export interface IReactionApplicationService {
    reactToPost(userId: string, postId: string, input: ReactToPostInput): Promise<Reaction>;
    removeReaction(userId: string, postId: string): Promise<void>;
    getReactionsByPostId(postId: string, page: number, limit: number): Promise<Reaction[]>;
    reactToComment(userId: string, commentId: string, input: ReactToPostInput): Promise<Reaction>;
    removeCommentReaction(userId: string, commentId: string): Promise<void>;
}

@Injectable()
export class ReactionApplicationService implements IReactionApplicationService {
    constructor(
        @Inject(REACTION_REPO_TOKEN)
        private readonly _reactionRepo: IReactionRepository,
        @Inject(POST_REPO_TOKEN)
        private readonly _postRepo: IPostRepository,
        @Inject(COMMENT_REPO_TOKEN)
        private readonly _commentRepo: ICommentRepository,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
    ) {}

    public async reactToPost(userId: string, postId: string, input: ReactToPostInput): Promise<Reaction> {
        const post = await this._postRepo.findById(postId);
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const existingReaction = await this._reactionRepo.findByContentIdAndUserId(postId, CONTENT_TYPE.POST, userId);

        if (existingReaction) {
            if (existingReaction.type === input.type) {
                return ReactionAppMapper.fromEntityToAppModel(existingReaction);
            }

            existingReaction.changeType(input.type);
            await this._reactionRepo.update(existingReaction);

            const events = existingReaction.publishEvents();
            await this._domainEventBus.publishAll(events);

            return ReactionAppMapper.fromEntityToAppModel(existingReaction);
        }

        const reaction = ReactionEntity.create({
            contentId: postId,
            contentType: CONTENT_TYPE.POST,
            userId,
            type: input.type,
        });

        await this._reactionRepo.insert(reaction);

        const events = reaction.publishEvents();
        await this._domainEventBus.publishAll(events);

        return ReactionAppMapper.fromEntityToAppModel(reaction);
    }

    public async removeReaction(userId: string, postId: string): Promise<void> {
        const reaction = await this._reactionRepo.findByContentIdAndUserId(postId, CONTENT_TYPE.POST, userId);

        if (!reaction) {
            throw new NotFoundException('Reaction not found');
        }

        reaction.remove();
        await this._reactionRepo.delete(reaction.id);

        const events = reaction.publishEvents();
        await this._domainEventBus.publishAll(events);
    }

    public async getReactionsByPostId(postId: string, page: number, limit: number): Promise<Reaction[]> {
        const post = await this._postRepo.findById(postId);
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const reactions = await this._reactionRepo.findByContentId(postId, CONTENT_TYPE.POST, page, limit);

        return reactions.map(ReactionAppMapper.fromEntityToAppModel);
    }

    public async reactToComment(userId: string, commentId: string, input: ReactToPostInput): Promise<Reaction> {
        const comment = await this._commentRepo.findById(commentId);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        const existingReaction = await this._reactionRepo.findByContentIdAndUserId(commentId, CONTENT_TYPE.COMMENT, userId);

        if (existingReaction) {
            if (existingReaction.type === input.type) {
                return ReactionAppMapper.fromEntityToAppModel(existingReaction);
            }

            existingReaction.changeType(input.type);
            await this._reactionRepo.update(existingReaction);

            const events = existingReaction.publishEvents();
            await this._domainEventBus.publishAll(events);

            return ReactionAppMapper.fromEntityToAppModel(existingReaction);
        }

        const reaction = ReactionEntity.create({
            contentId: commentId,
            contentType: CONTENT_TYPE.COMMENT,
            userId,
            type: input.type,
        });

        await this._reactionRepo.insert(reaction);

        const events = reaction.publishEvents();
        await this._domainEventBus.publishAll(events);

        return ReactionAppMapper.fromEntityToAppModel(reaction);
    }

    public async removeCommentReaction(userId: string, commentId: string): Promise<void> {
        const reaction = await this._reactionRepo.findByContentIdAndUserId(commentId, CONTENT_TYPE.COMMENT, userId);

        if (!reaction) {
            throw new NotFoundException('Reaction not found');
        }

        reaction.remove();
        await this._reactionRepo.delete(reaction.id);

        const events = reaction.publishEvents();
        await this._domainEventBus.publishAll(events);
    }
}
