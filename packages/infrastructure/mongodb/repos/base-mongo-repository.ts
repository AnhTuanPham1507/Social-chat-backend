import { Model, SortOrder, UpdateQuery, ProjectionType } from 'mongoose';

export abstract class BaseMongoRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) {}

    async insert(doc: Record<string, any>): Promise<void> {
        await this.model.create(doc as any);
    }

    async findById(id: string): Promise<TDocument | null> {
        return this.model.findById(id).lean().exec() as Promise<TDocument | null>;
    }

    async findOne(filter: Record<string, any>): Promise<TDocument | null> {
        return this.model.findOne(filter).lean().exec() as Promise<TDocument | null>;
    }

    async findMany(
        filter: Record<string, any>,
        options?: {
            sort?: Record<string, SortOrder>;
            limit?: number;
            skip?: number;
            projection?: ProjectionType<TDocument>;
        },
    ): Promise<TDocument[]> {
        let query = this.model.find(filter);

        if (options?.projection) query = query.select(options.projection);
        if (options?.sort) query = query.sort(options.sort);
        if (options?.skip) query = query.skip(options.skip);
        if (options?.limit) query = query.limit(options.limit);

        return query.lean().exec() as Promise<TDocument[]>;
    }

    async upsert(
        id: string,
        data: Partial<Record<string, any>>,
    ): Promise<void> {
        await this.model.updateOne(
            { _id: id } as any,
            { $set: data },
            { upsert: true },
        ).exec();
    }

    async updateOne(
        filter: Record<string, any>,
        update: UpdateQuery<TDocument>,
    ): Promise<void> {
        await this.model.updateOne(filter, update).exec();
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.model.deleteOne({ _id: id } as any).exec();
        return result.deletedCount > 0;
    }

    async count(filter?: Record<string, any>): Promise<number> {
        return this.model.countDocuments(filter || {}).exec();
    }

    async exists(filter: Record<string, any>): Promise<boolean> {
        const doc = await this.model.exists(filter).exec();
        return !!doc;
    }
}
