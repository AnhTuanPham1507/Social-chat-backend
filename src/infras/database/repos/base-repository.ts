import { InternalServerErrorException } from '@nestjs/common';
import {
    DeepPartial,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    Repository,
} from 'typeorm';

export interface IRepo<T> {
    exists(t: T, fieldNames: string[]): Promise<boolean>;
    findOne(query: object): Promise<T | null>;
    findAll(options?: FindManyOptions<T>): Promise<T[]>;
    findBy(where: FindOptionsWhere<T>): Promise<T[]>;
    create(entity: DeepPartial<T>): Promise<T>;
    createMany(entities: DeepPartial<T>[]): Promise<T[]>;
    update(id: string, updates: DeepPartial<T>): Promise<void>;
    updateMany(
        where: FindOptionsWhere<T>,
        updates: DeepPartial<T>,
    ): Promise<void>;
    delete(id: string): Promise<boolean>;
    deleteMany(where: FindOptionsWhere<T>): Promise<number>;
    hardDelete(id: string): Promise<boolean>;
    count(where?: FindOptionsWhere<T>): Promise<number>;
    existsBy(where: FindOptionsWhere<T>): Promise<boolean>;
}

export abstract class BaseRepository<TModel> implements IRepo<TModel> {
    protected repo: Repository<TModel>;

    constructor(repo: Repository<TModel>) {
        this.repo = repo;
    }

    /**
     * Find entity by ID
     */
    public async findById(id: string): Promise<TModel | null> {
        const model = await this.repo.findOne({
            where: { id } as unknown as FindOptionsWhere<TModel>,
        });
        return model || null;
    }

    /**
     * Find one entity by conditions
     */
    public async findOne(
        query: FindOptionsWhere<TModel>,
    ): Promise<TModel | null> {
        const model = await this.repo.findOne({
            where: query,
        });
        return model || null;
    }

    /**
     * Find one entity with options (relations, select, etc.)
     */
    public async findOneWithOptions(
        options: FindOneOptions<TModel>,
    ): Promise<TModel | null> {
        const model = await this.repo.findOne(options);
        return model || null;
    }

    /**
     * Find all entities
     */
    public async findAll(options?: FindManyOptions<TModel>): Promise<TModel[]> {
        return this.repo.find(options);
    }

    /**
     * Find entities by conditions
     */
    public async findBy(where: FindOptionsWhere<TModel>): Promise<TModel[]> {
        return this.repo.findBy(where);
    }

    /**
     * Create a new entity
     */
    public async create(model: DeepPartial<TModel>): Promise<TModel> {
        return this.repo.save(model);
    }

    /**
     * Create multiple entities
     */
    public async createMany(models: DeepPartial<TModel>[]): Promise<TModel[]> {
        return this.repo.save(models);
    }

    /**
     * Update entity by ID
     */
    public async update(
        id: string,
        updates: DeepPartial<TModel>,
    ): Promise<void> {
        await this.repo.update(id, updates as any);
    }

    /**
     * Update multiple entities by conditions
     */
    public async updateMany(
        where: FindOptionsWhere<TModel>,
        updates: DeepPartial<TModel>,
    ): Promise<void> {
        await this.repo.update(where, updates as any);
    }

    /**
     * Delete entity by ID (soft delete)
     */
    public async delete(id: string): Promise<boolean> {
        const result = await this.repo.softDelete(id);
        return (result.affected || 0) > 0;
    }

    /**
     * Delete multiple entities by conditions (soft delete)
     */
    public async deleteMany(where: FindOptionsWhere<TModel>): Promise<number> {
        const result = await this.repo.softDelete(where);
        return result.affected || 0;
    }

    /**
     * Permanently delete entity by ID
     */
    public async hardDelete(id: string): Promise<boolean> {
        const result = await this.repo.delete(id);
        return (result.affected || 0) > 0;
    }

    /**
     * Count entities
     */
    public async count(where?: FindOptionsWhere<TModel>): Promise<number> {
        return this.repo.count({ where });
    }

    /**
     * Check if entity exists
     */
    public async exists(
        t: Record<string, any>,
        fieldNames: string[],
    ): Promise<boolean> {
        const query: FindOptionsWhere<TModel>[] = [];

        fieldNames.forEach((fieldName) => {
            if (!t[fieldName]) {
                throw new InternalServerErrorException(
                    `Field ${fieldName} not found`,
                );
            }

            query.push({
                [fieldName]: t[fieldName],
            } as FindOptionsWhere<TModel>);
        });

        const entity = await this.repo.findOne({
            where: query,
        });
        return !!entity;
    }

    /**
     * Check if entity exists by conditions
     */
    public async existsBy(where: FindOptionsWhere<TModel>): Promise<boolean> {
        const count = await this.repo.count({ where });
        return count > 0;
    }
    /**
     * Get repository instance (for advanced operations)
     */
    public getRepository(): Repository<TModel> {
        return this.repo;
    }
}
