import { InternalServerErrorException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';

import { IRepo } from '../core/base-repo.interface';

export abstract class BaseRepo<T> implements IRepo<T> {
    protected repo: Repository<T>;

    constructor(repo: Repository<T>) {
        this.repo = repo;
    }

    async findOne(query: FindOptionsWhere<T>): Promise<T | null> {
        return (
            (await this.repo.findOne({
                where: query,
            })) || null
        );
    }

    async exists(
        t: Record<string, any>,
        fieldNames: string[],
    ): Promise<boolean> {
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

    async insert(t: Partial<T>): Promise<Record<string, any> | null> {
        const createdRow = await this.repo.insert(t as any);

        return createdRow.generatedMaps[0];
    }
}
