import { IQueryOptions, IRepo } from '../../../core/interfaces/base-repo.interface';
import { FindOptionsSelect, Repository } from 'typeorm';

export abstract class BaseRepo<T> implements IRepo<T> {
    protected repo: Repository<T>;

    constructor(repo: Repository<T>) {
        this.repo = repo;
    }
    async findOne(query: IQueryOptions): Promise<T | null> {
        const {selections, queryParams} = query
        return (
            (await this.repo.findOne({
                where: queryParams,
                select: selections as unknown as FindOptionsSelect<T>
            })) || null
        );
    }

    async create(t: T): Promise<T> {
        const entity = await this.repo.create(t);
        return this.repo.save(entity);
    }
}
