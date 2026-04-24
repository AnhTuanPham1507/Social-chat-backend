import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentRead, CommentReadDocument } from '../schemas/comment-read.schema';
import { BaseMongoRepository } from './base-mongo-repository';

@Injectable()
export class CommentReadMongoRepository extends BaseMongoRepository<CommentReadDocument> {
    constructor(
        @InjectModel(CommentRead.name) model: Model<CommentReadDocument>,
    ) {
        super(model);
    }

    async incrementReactionCount(
        commentId: string,
        reactionType: string,
        delta: number,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: commentId },
            {
                $inc: {
                    [`reactionCounts.${reactionType}`]: delta,
                },
            },
        ).exec();
    }

    async changeReactionCount(
        commentId: string,
        oldType: string,
        newType: string,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: commentId },
            {
                $inc: {
                    [`reactionCounts.${oldType}`]: -1,
                    [`reactionCounts.${newType}`]: 1,
                },
            },
        ).exec();
    }

    async incrementRepliesCount(
        commentId: string,
        delta: number,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: commentId },
            { $inc: { repliesCount: delta } },
        ).exec();
    }

    async updateAuthorByUserId(
        userId: string,
        author: { name: string; avatar?: string },
    ): Promise<void> {
        await this.model.updateMany(
            { 'author.id': userId },
            {
                $set: {
                    'author.name': author.name,
                    'author.avatar': author.avatar ?? null,
                },
            },
        ).exec();
    }
}
