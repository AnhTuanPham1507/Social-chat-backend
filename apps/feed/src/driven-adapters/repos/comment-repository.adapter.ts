import { Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

import { CommentPersistenceMapper } from './mappers/comment-persistence.mapper';
import { BaseCommentRepository } from '@social-chat/infrastructure';
import { CommentEntity } from '@social-chat/domain';
import { ICommentRepository } from '@application/contracts/comment-repository.contract';

@Injectable()
export class CommentRepo implements ICommentRepository {
    constructor(
        private _commentRepo: BaseCommentRepository,
    ) {}

    public async insert(comment: CommentEntity): Promise<void> {
        const model = CommentPersistenceMapper.fromEntityToModel(comment);
        await this._commentRepo.create(model);
    }

    public async update(comment: CommentEntity): Promise<void> {
        const model = CommentPersistenceMapper.fromEntityToModel(comment);
        await this._commentRepo.update(comment.id, model);
    }

    public async softDelete(id: string): Promise<void> {
        await this._commentRepo.getRepository().softDelete(id);
    }

    public async softDeleteByPostId(postId: string): Promise<number> {
        return this._commentRepo.deleteMany({ postId } as any);
    }

    public async findAllByPostId(postId: string): Promise<CommentEntity[]> {
        const models = await this._commentRepo.findAll({
            where: { postId, deletedAt: IsNull() } as any,
        });
        return models.map(CommentPersistenceMapper.fromModelToEntity);
    }

    public async findById(id: string): Promise<CommentEntity | null> {
        const model = await this._commentRepo.findOne({ id, deletedAt: IsNull() } as any);
        return model ? CommentPersistenceMapper.fromModelToEntity(model) : null;
    }

    public async findByPostId(postId: string, page: number, limit: number): Promise<CommentEntity[]> {
        const models = await this._commentRepo.findAll({
            where: { postId, deletedAt: IsNull() } as any,
            order: { createdAt: 'DESC' } as any,
            skip: (page - 1) * limit,
            take: limit,
        });
        return models.map(CommentPersistenceMapper.fromModelToEntity);
    }

    public async countByPostId(postId: string): Promise<number> {
        return this._commentRepo.count({ postId, deletedAt: IsNull() } as any);
    }
}
