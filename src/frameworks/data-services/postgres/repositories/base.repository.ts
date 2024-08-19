import { IRepo } from 'src/core/interfaces/base-repo.interface';
import { QueryFailedError, Repository } from 'typeorm';

export class BaseRepo<T> implements IRepo<T> {
    protected repo: Repository<T>;

    constructor(repo: Repository<T>) {
        this.repo = repo;
    }

    private getFailedFieldName(error: QueryFailedError): string | null {
        const message = error.message;
        const driverError = error.driverError as any;

        if (driverError && driverError.code === '23505') {
            const match = message.match(/Key \((.*?)\)=/);
            return match ? match[1] : null;
        }
        return null;
    }
    async exists(
        t: T,
        fieldNames: string[],
    ): Promise<{ isExisted: boolean; duplicatedFieldName: string | null }> {
        try {
            const query = {};
            fieldNames.forEach((fieldName) => {
                if (!t[fieldName]) {
                    throw new Error(`fieldName ${fieldName} not found`);
                }

                query[fieldName] = t[fieldName];
            });

            const entity = await this.repo.findOne({
                where: query,
            });

            return { isExisted: !!entity, duplicatedFieldName: null };
        } catch (error) {
            if (error instanceof QueryFailedError) {
                const duplicatedFieldName = this.getFailedFieldName(error);

                return {
                    isExisted: true,
                    duplicatedFieldName,
                };
            }

            throw error;
        }
    }
    save(t: T): Promise<T> {
        return this.repo.save(t);
    }
}
