import { Injectable } from '@nestjs/common';

import { PostPersistenceMapper } from './mappers/post-persistence.mapper';
import { BasePostRepository } from '@social-chat/infrastructure';
import { PostEntity, POST_VISIBILITY } from '@social-chat/domain';
import { IPostRepository } from '@application/contracts/post-repository.contract';

@Injectable()
export class PostRepo implements IPostRepository {
    constructor(
        private _postRepo: BasePostRepository,
    ) {}

    public async insert(post: PostEntity): Promise<void> {
        const postModel = PostPersistenceMapper.fromEntityToModel(post);
        await this._postRepo.create(postModel);
    }

    public async update(post: PostEntity): Promise<void> {
        const postModel = PostPersistenceMapper.fromEntityToModel(post);
        await this._postRepo.update(post.id, postModel);
    }

    public async delete(id: string): Promise<void> {
        await this._postRepo.delete(id);
    }

    public async findById(id: string): Promise<PostEntity | null> {
        const postModel = await this._postRepo.findOne({ id });

        return postModel ? PostPersistenceMapper.fromModelToEntity(postModel) : null;
    }

    public async findByAuthorId(authorId: string, page: number, limit: number): Promise<PostEntity[]> {
        const posts = await this._postRepo.findAll({
            where: { authorId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return posts.map(PostPersistenceMapper.fromModelToEntity);
    }

    public async findFeed(page: number, limit: number): Promise<PostEntity[]> {
        const posts = await this._postRepo.findAll({
            where: { visibility: POST_VISIBILITY.PUBLIC },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return posts.map(PostPersistenceMapper.fromModelToEntity);
    }
}
