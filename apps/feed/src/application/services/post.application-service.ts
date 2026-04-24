import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPE, DOMAIN_EVENT_BUS_TOKEN, IDomainEventBus, PostEntity } from '@social-chat/domain';
import { PostDeletedIntegrationEvent } from '@social-chat/common';
import { KafkaProducerService } from '@social-chat/infrastructure';
import { CreatePostInput, PostDTO, SharePostInput, UpdatePostInput } from '../dtos/post.dto';
import { IPostRepository, POST_REPO_TOKEN } from '../contracts/post-repository.contract';
import { ICommentRepository, COMMENT_REPO_TOKEN } from '../contracts/comment-repository.contract';
import { IReactionRepository, REACTION_REPO_TOKEN } from '../contracts/reaction-repository.contract';
import { PostAppMapper } from '../mappers/post-app.mapper';

export const POST_APPLICATION_SERVICE_TOKEN = Symbol('POST_APPLICATION_SERVICE_TOKEN');

export interface IPostApplicationService {
    createPost(userId: string, input: CreatePostInput): Promise<PostDTO>;
    sharePost(userId: string, originalPostId: string, input: SharePostInput): Promise<PostDTO>;
    updatePost(userId: string, postId: string, input: UpdatePostInput): Promise<PostDTO>;
    deletePost(userId: string, postId: string): Promise<void>;
}

@Injectable()
export class PostApplicationService implements IPostApplicationService {
    constructor(
        @Inject(POST_REPO_TOKEN)
        private readonly _postRepo: IPostRepository,
        @Inject(COMMENT_REPO_TOKEN)
        private readonly _commentRepo: ICommentRepository,
        @Inject(REACTION_REPO_TOKEN)
        private readonly _reactionRepo: IReactionRepository,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
        private readonly _kafkaProducer: KafkaProducerService,
    ) {}

    public async createPost(userId: string, input: CreatePostInput): Promise<PostDTO> {
        const postEntity = PostEntity.create({
            authorId: userId,
            content: input.content,
            visibility: input.visibility,
            attachmentKeys: input.attachmentKeys,
        });

        await this._postRepo.insert(postEntity);

        const events = postEntity.publishEvents();
        await this._domainEventBus.publishAll(events);

        return PostAppMapper.fromEntityToAppModel(postEntity);
    }

    public async sharePost(userId: string, originalPostId: string, input: SharePostInput): Promise<PostDTO> {
        const originalPost = await this._postRepo.findById(originalPostId);

        if (!originalPost) {
            throw new NotFoundException('Original post not found');
        }

        // Domain enforces all share rules (deleted, private, chain flattening, composition).
        const sharePost = PostEntity.share({
            sharerId: userId,
            originalPost,
            comment: input.comment,
            visibility: input.visibility,
        });

        console.log('sharePost', sharePost);

        await this._postRepo.insert(sharePost);

        const events = sharePost.publishEvents();
        await this._domainEventBus.publishAll(events);

        return PostAppMapper.fromEntityToAppModel(sharePost);
    }

    public async updatePost(userId: string, postId: string, input: UpdatePostInput): Promise<PostDTO> {
        const postEntity = await this._postRepo.findById(postId);

        if (!postEntity) {
            throw new NotFoundException('Post not found');
        }

        if (postEntity.authorId !== userId) {
            throw new ForbiddenException('You can only update your own posts');
        }

        postEntity.updatePost(input);
        await this._postRepo.update(postEntity);

        const events = postEntity.publishEvents();
        await this._domainEventBus.publishAll(events);

        return PostAppMapper.fromEntityToAppModel(postEntity);
    }

    public async deletePost(userId: string, postId: string): Promise<void> {
        const postEntity = await this._postRepo.findById(postId);

        if (!postEntity) {
            throw new NotFoundException('Post not found');
        }

        if (postEntity.authorId !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        const comments = await this._commentRepo.findAllByPostId(postId);
        const cascadedCommentSnapshots = comments.map((c) => c.toSnapshot());
        const commentIds = comments.map((c) => c.id);

        await this._reactionRepo.deleteByContentId(postId, CONTENT_TYPE.POST);
        if (commentIds.length > 0) {
            await this._reactionRepo.deleteByContentIds(commentIds, CONTENT_TYPE.COMMENT);
        }

        await this._commentRepo.softDeleteByPostId(postId);

        postEntity.delete();
        await this._postRepo.update(postEntity);

        const events = postEntity.publishEvents();
        await this._domainEventBus.publishAll(events);

        // Cross-aggregate coordination: the integration event composes the post's own
        // snapshot with the cascaded comment snapshots the aggregate can't know about.
        // Published directly rather than via a translator listener because the cascade
        // data lives here, not on the domain event.
        const integrationEvent = new PostDeletedIntegrationEvent(
            postEntity.toSnapshot(),
            cascadedCommentSnapshots,
        );
        await this._kafkaProducer.publish(
            PostDeletedIntegrationEvent.TOPIC,
            postId,
            integrationEvent,
        );
    }
}
