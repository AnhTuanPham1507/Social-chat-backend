import { InternalServerErrorException } from '@nestjs/common';
import { IRepo } from '../../../core/interfaces/base-repo.interface';
import { Repository } from 'typeorm';

export class BaseRepo<T> implements IRepo<T> {
    protected repo: Repository<T>;

    constructor(repo: Repository<T>) {
        this.repo = repo;
    }
    async findOne(query: object): Promise<T | null> {
        return await this.repo.findOne({
            where: query,
        }) || null;
    }

    async exists(t: T, fieldNames: string[]): Promise<boolean> {
        const query = [];

        fieldNames.forEach((fieldName) => {
            if (!t[fieldName]) {
                throw new InternalServerErrorException(
                    `Field ${fieldName} not found`,
                );
            }

            query.push({
                [fieldName]: t[fieldName],
            });
        });

        const entity = await this.repo.findOne({
            where: query,
        });
        const isExisted = !!entity;

        return isExisted;
    }

    save(t: T): Promise<T> {
        return this.repo.save(t);
    }
}
