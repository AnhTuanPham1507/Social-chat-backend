import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReactionRead, ReactionReadDocument } from '../schemas/reaction-read.schema';
import { BaseMongoRepository } from './base-mongo-repository';

@Injectable()
export class ReactionReadMongoRepository extends BaseMongoRepository<ReactionReadDocument> {
    constructor(
        @InjectModel(ReactionRead.name) model: Model<ReactionReadDocument>,
    ) {
        super(model);
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

    async aggregateReactionCountsByUserId(
        userId: string,
    ): Promise<{ contentId: string; contentType: string; reaction: string; count: number }[]> {
        return this.model.aggregate([
            { $match: { 'author.id': userId } },
            {
                $group: {
                    _id: { contentId: '$contentId', contentType: '$contentType', reaction: '$reaction' },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    contentId: '$_id.contentId',
                    contentType: '$_id.contentType',
                    reaction: '$_id.reaction',
                    count: 1,
                },
            },
        ]).exec();
    }

    async deleteAllByUserId(userId: string): Promise<void> {
        await this.model.deleteMany({ 'author.id': userId }).exec();
    }
}
