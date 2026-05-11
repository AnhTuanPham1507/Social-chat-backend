import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { In } from 'typeorm';

import { UserPersistenceMapper } from './mappers/user-persistence.mapper';
import { BaseUserRepository, REDIS_SERVICE_TOKEN, RedisBaseService, SharedStoreKeyHelper, UserModel } from '@social-chat/infrastructure';
import { UserEntity } from '@social-chat/domain';
import { AutocompleteHit, IUserRepository, SearchHit } from '@application/contracts/user-repository.contract';

@Injectable()
export class UserRepo implements IUserRepository {
    constructor(
        private _userRepo: BaseUserRepository,
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _redisService: RedisBaseService,
    ) {}

    public async insert(user: UserEntity): Promise<void> {
        const userModel = UserPersistenceMapper.fromEntityToModel(user);
        const createdUser = await this._userRepo.create(userModel);

        if (!createdUser) {
            throw new InternalServerErrorException("Can't create user");
        }

        const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(createdUser.id);
        await this._redisService.hset(userInfoKey, createdUser);
    }

    public async findById(id: string): Promise<UserEntity | null> {
        const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(id);
        const cached = await this._redisService.hgetall(userInfoKey);

        const userModel: UserModel = cached
            ? (cached as unknown as UserModel)
            : await this._userRepo.findOne({ id });

        return userModel ? UserPersistenceMapper.fromModelToEntity(userModel) : null;
    }

    public async findByEmail(email: string): Promise<UserEntity | null> {
        const userModel = await this._userRepo.findOne({ email });

        return userModel ? UserPersistenceMapper.fromModelToEntity(userModel) : null;
    }

    public async findByIds(ids: string[]): Promise<UserEntity[]> {
        if (ids.length === 0) return [];

        const models = await this._userRepo.findBy({ id: In(ids) });
        return models.map((m) => UserPersistenceMapper.fromModelToEntity(m));
    }

    public async update(user: UserEntity): Promise<void> {
        const userModel = UserPersistenceMapper.fromEntityToModel(user);
        await this._userRepo.update(user.id, userModel);

        // Update cache
        const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(user.id);
        await this._redisService.hset(userInfoKey, userModel);
    }

    public async searchByName(
        query: string,
        options: { limit: number; offset?: number; excludeUserId?: string },
    ): Promise<{ items: SearchHit[]; total: number }> {
        const { limit, offset = 0, excludeUserId } = options;
        const trimmed = query.trim();
        if (!trimmed) return { items: [], total: 0 };

        const repo = this._userRepo.getRepository();

        // Trigram similarity: ranks fuzzy/substring matches. Uses idx_users_full_name_trgm.
        // The `%` operator threshold is the session pg_trgm.similarity_threshold (default 0.3),
        // which handles typos well; we set it lower per-query for short prefixes.
        const params: any[] = [trimmed];
        let exclusion = '';
        if (excludeUserId) {
            params.push(excludeUserId);
            exclusion = `AND u.id <> $${params.length}`;
        }

        // Compute count and page in two queries — simpler than CTE-with-window-function.
        const countSql = `
            SELECT COUNT(*)::int AS count
            FROM users u
            WHERE u.deleted_at IS NULL
              ${exclusion}
              AND lower(immutable_unaccent(u.full_name)) % lower(immutable_unaccent($1))
        `;
        const countResult: { count: number }[] = await repo.query(countSql, params);
        const total = countResult[0]?.count ?? 0;

        if (total === 0) return { items: [], total: 0 };

        params.push(limit, offset);
        const limitParam = `$${params.length - 1}`;
        const offsetParam = `$${params.length}`;

        // Alias snake_case columns to camelCase so the row matches UserModel.
        // (Raw queries bypass SnakeNamingStrategy; QueryBuilder would also work
        // but explicit aliasing is the project's established pattern — see
        // FriendshipRepo.findFriendsByUserId.)
        const itemsSql = `
            SELECT
                u.id,
                u.full_name AS "fullName",
                u.email,
                u.phone,
                u.sex,
                u.avatar_url AS "avatarUrl",
                u.interests,
                u.has_completed_onboarding AS "hasCompletedOnboarding",
                u.created_at AS "createdAt",
                u.updated_at AS "updatedAt",
                u.deleted_at AS "deletedAt",
                similarity(lower(immutable_unaccent(u.full_name)), lower(immutable_unaccent($1))) AS sim
            FROM users u
            WHERE u.deleted_at IS NULL
              ${exclusion}
              AND lower(immutable_unaccent(u.full_name)) % lower(immutable_unaccent($1))
            ORDER BY sim DESC, u.created_at DESC, u.id DESC
            LIMIT ${limitParam} OFFSET ${offsetParam}
        `;
        const rows: (UserModel & { sim: string })[] = await repo.query(itemsSql, params);

        const items = rows.map((row) => ({
            user: UserPersistenceMapper.fromModelToEntity(row as UserModel),
            score: parseFloat(row.sim) || 0,
        }));

        return { items, total };
    }

    public async autocompleteByName(
        query: string,
        options: { limit: number; excludeUserId?: string },
    ): Promise<AutocompleteHit[]> {
        const { limit, excludeUserId } = options;
        const trimmed = query.trim();
        if (!trimmed) return [];

        const repo = this._userRepo.getRepository();

        // Token-prefix match: query starts a word in full_name.
        // The `\m` regex anchor catches word boundaries in Vietnamese names.
        // For learning-project scale this is fine; at 1M+ rows we'd switch to a
        // tokenized side-table or a tsvector with prefix-search.
        const params: any[] = [`\\m${trimmed}`];
        let exclusion = '';
        if (excludeUserId) {
            params.push(excludeUserId);
            exclusion = `AND u.id <> $${params.length}`;
        }
        params.push(limit);
        const limitParam = `$${params.length}`;

        const sql = `
            SELECT u.id, u.full_name AS "fullName"
            FROM users u
            WHERE u.deleted_at IS NULL
              ${exclusion}
              AND lower(immutable_unaccent(u.full_name)) ~* lower(immutable_unaccent($1))
            ORDER BY u.full_name ASC
            LIMIT ${limitParam}
        `;

        return repo.query(sql, params);
    }

    public async findAllPaginated(options: {
        page: number;
        limit: number;
        search?: string;
        excludeUserId?: string;
    }): Promise<{ data: UserEntity[]; total: number }> {
        const { page, limit, search, excludeUserId } = options;
        const skip = (page - 1) * limit;

        const qb = this._userRepo
            .getRepository()
            .createQueryBuilder('u')
            .where('u.deleted_at IS NULL');

        if (excludeUserId) {
            qb.andWhere('u.id != :excludeUserId', { excludeUserId });
        }

        if (search) {
            qb.andWhere('u.full_name ILIKE :search', { search: `%${search}%` });
        }

        qb.orderBy('u.full_name', 'ASC');

        const total = await qb.getCount();
        const models = await qb.skip(skip).take(limit).getMany();

        const entities = models.map((model) =>
            UserPersistenceMapper.fromModelToEntity(model),
        );

        return { data: entities, total };
    }
}
