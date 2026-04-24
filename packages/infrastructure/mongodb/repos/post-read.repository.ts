import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { PostRead, PostReadDocument } from '../schemas/post-read.schema';
import { BaseMongoRepository } from './base-mongo-repository';

@Injectable()
export class PostReadMongoRepository extends BaseMongoRepository<PostReadDocument> {
    constructor(
        @InjectModel(PostRead.name) model: Model<PostReadDocument>,
    ) {
        super(model);
    }

    /**
     * Finds posts with their original post AND its author embedded via $lookup.
     * Non-share posts come through unchanged (originalPost / originalPostAuthor stay undefined).
     * Tombstone logic (hiding deleted/private originals) lives in the application layer.
     */
    async findManyWithOriginal(
        filter: Record<string, any>,
        options: {
            sort: Record<string, 1 | -1>;
            skip?: number;
            limit: number;
        },
    ): Promise<any[]> {
        const pipeline: PipelineStage[] = [
            { $match: filter },
            { $sort: options.sort },
        ];

        if (options.skip !== undefined && options.skip > 0) {
            pipeline.push({ $skip: options.skip });
        }

        pipeline.push({ $limit: options.limit });

        return this.model
            .aggregate<any>([
                ...pipeline,
                // Join the original post (when this row is a share)
                {
                    $lookup: {
                        from: 'feed_posts',
                        localField: 'originalPostId',
                        foreignField: '_id',
                        as: 'originalPost',
                    },
                },
                {
                    $unwind: {
                        path: '$originalPost',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // Join the original post's author profile
                {
                    $lookup: {
                        from: 'feed_users',
                        localField: 'originalPost.authorId',
                        foreignField: '_id',
                        as: 'originalPostAuthor',
                    },
                },
                {
                    $unwind: {
                        path: '$originalPostAuthor',
                        preserveNullAndEmptyArrays: true,
                    },
                },
            ])
            .exec();
    }

    async incrementReactionCount(
        postId: string,
        reactionType: string,
        delta: number,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: postId },
            {
                $inc: {
                    [`reactionCounts.${reactionType}`]: delta,
                },
            },
        ).exec();
    }

    async changeReactionCount(
        postId: string,
        oldType: string,
        newType: string,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: postId },
            {
                $inc: {
                    [`reactionCounts.${oldType}`]: -1,
                    [`reactionCounts.${newType}`]: 1,
                },
            },
        ).exec();
    }

    async incrementField(
        postId: string,
        field: string,
        delta: number,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: postId },
            { $inc: { [field]: delta } },
        ).exec();
    }

    async updateField(
        postId: string,
        field: string,
        value: any,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: postId },
            { $set: { [field]: value } },
        ).exec();
    }
}
