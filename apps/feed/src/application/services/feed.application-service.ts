import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostEntity } from '@social-chat/domain';
import { CreatePostInput, Post, UpdatePostInput } from '../dtos/post.dto';
import { IPostRepository, POST_REPO_TOKEN } from '../contracts/post-repository.contract';
import { PostAppMapper } from '../mappers/post-app.mapper';
import { FeedEventPublisherAdapter } from '../../driven-adapters/event-publisher/feed-event-publisher.adapter';

export const FEED_APPLICATION_SERVICE_TOKEN = Symbol('FEED_APPLICATION_SERVICE_TOKEN');

export interface IFeedApplicationService {
    createPost(userId: string, input: CreatePostInput): Promise<Post>;
    updatePost(userId: string, postId: string, input: UpdatePostInput): Promise<Post>;
    deletePost(userId: string, postId: string): Promise<void>;
    getPostById(postId: string): Promise<Post>;
    getPostsByAuthor(authorId: string, page: number, limit: number): Promise<Post[]>;
    getFeed(page: number, limit: number): Promise<Post[]>;
}

@Injectable()
export class FeedApplicationService implements IFeedApplicationService {
    constructor(
        @Inject(POST_REPO_TOKEN)
        private readonly _postRepo: IPostRepository,
        private readonly _feedEventPublisher: FeedEventPublisherAdapter,
    ) {}

    public async createPost(userId: string, input: CreatePostInput): Promise<Post> {
        const postEntity = PostEntity.create({
            authorId: userId,
            content: input.content,
            visibility: input.visibility,
            attachmentKeys: input.attachmentKeys,
        });

        await this._postRepo.insert(postEntity);

        const events = postEntity.publishEvents();
        await this._feedEventPublisher.publishAll(events);

        return PostAppMapper.fromEntityToAppModel(postEntity);
    }

    public async updatePost(userId: string, postId: string, input: UpdatePostInput): Promise<Post> {
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
        await this._feedEventPublisher.publishAll(events);

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

        postEntity.delete();
        await this._postRepo.update(postEntity);

        const events = postEntity.publishEvents();
        await this._feedEventPublisher.publishAll(events);
    }

    public async getPostById(postId: string): Promise<Post> {
        const postEntity = await this._postRepo.findById(postId);

        if (!postEntity) {
            throw new NotFoundException('Post not found');
        }

        return PostAppMapper.fromEntityToAppModel(postEntity);
    }

    public async getPostsByAuthor(authorId: string, page: number, limit: number): Promise<Post[]> {
        const posts = await this._postRepo.findByAuthorId(authorId, page, limit);

        return posts.map(PostAppMapper.fromEntityToAppModel);
    }

    public async getFeed(page: number, limit: number): Promise<Post[]> {
        const posts = await this._postRepo.findFeed(page, limit);

        return posts.map(PostAppMapper.fromEntityToAppModel);
    }
}
