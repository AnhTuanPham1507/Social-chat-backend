import { BadRequestException, Injectable } from '@nestjs/common';

import { ConversationEntity, CONVERSATION_TYPE } from '@social-chat/domain';
import {
    BaseConversationRepository,
    ConversationModel,
} from '@social-chat/infrastructure';

import {
    FindByMemberOptions,
    FindByMemberResult,
    IConversationRepository,
} from '@application/contracts/conversation-repository.contract';
import { ConversationPersistenceMapper } from './mappers/conversation-persistence.mapper';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

interface InboxCursor {
    /** ISO8601 lastActivityAt of the last row of the previous page. */
    a: string;
    /** id of the last row of the previous page. */
    i: string;
}

@Injectable()
export class ConversationRepo implements IConversationRepository {
    constructor(private readonly _repo: BaseConversationRepository) {}

    public async insert(conversation: ConversationEntity): Promise<void> {
        const model = ConversationPersistenceMapper.fromEntityToModel(conversation);
        await this._repo.create(model);
    }

    public async findById(id: string): Promise<ConversationEntity | null> {
        const model = await this._repo.findOneWithOptions({
            where: { id },
            relations: ['members'],
        });

        return model ? ConversationPersistenceMapper.fromModelToEntity(model) : null;
    }

    public async findExistingDM(
        userIdA: string,
        userIdB: string,
    ): Promise<ConversationEntity | null> {
        const [lower, higher] = [userIdA, userIdB].sort();

        const model = await this._repo.findOneWithOptions({
            where: {
                type: CONVERSATION_TYPE.DIRECT,
                lowerUserId: lower,
                higherUserId: higher,
            },
            relations: ['members'],
        });

        return model ? ConversationPersistenceMapper.fromModelToEntity(model) : null;
    }

    /**
     * Page the inbox: conversations the user is a member of, ordered by
     * (lastActivityAt DESC, id DESC) with an opaque cursor.
     *
     * The strict-after predicate `(a, id) < (cursorA, cursorI)` is expressed
     * as `a < cursorA OR (a = cursorA AND id < cursorI)` since TypeORM's
     * QueryBuilder doesn't directly speak row-value comparison portably.
     *
     * `relations: ['members']` would be cleaner but TypeORM doesn't combine
     * relations with a LIMIT correctly (it joins THEN limits, producing
     * truncated rows). We do a paged query for ids first, then a second
     * fetch for members. Two queries, but always exactly two.
     */
    public async findByMemberId(
        userId: string,
        opts: FindByMemberOptions,
    ): Promise<FindByMemberResult> {
        const limit = clampLimit(opts.limit);
        const cursor = decodeCursor(opts.cursor);

        const qb = this._repo
            .getRepository()
            .createQueryBuilder('c')
            .innerJoin(
                'conversation_members',
                'cm',
                'cm.conversation_id = c.id AND cm.user_id = :userId',
                { userId },
            )
            .orderBy('c.last_activity_at', 'DESC')
            .addOrderBy('c.id', 'DESC')
            .limit(limit + 1);

        if (cursor) {
            qb.andWhere(
                '(c.last_activity_at < :cursorA OR (c.last_activity_at = :cursorA AND c.id < :cursorI))',
                { cursorA: cursor.a, cursorI: cursor.i },
            );
        }

        const rowsPlusOne = await qb.getMany();
        const hasMore = rowsPlusOne.length > limit;
        const rows = hasMore ? rowsPlusOne.slice(0, limit) : rowsPlusOne;

        // Hydrate members in a single follow-up query.
        if (rows.length > 0) {
            const ids = rows.map((r) => r.id);
            const withMembers = await this._repo
                .getRepository()
                .createQueryBuilder('c')
                .leftJoinAndSelect('c.members', 'members')
                .where('c.id IN (:...ids)', { ids })
                .getMany();
            const byId = new Map(withMembers.map((c) => [c.id, c]));
            for (const r of rows) {
                r.members = byId.get(r.id)?.members ?? [];
            }
        }

        const last = rows.length > 0 ? rows[rows.length - 1] : null;
        const nextCursor =
            hasMore && last
                ? encodeCursor({ a: last.lastActivityAt.toISOString(), i: last.id })
                : null;

        return {
            items: rows.map(ConversationPersistenceMapper.fromModelToEntity),
            nextCursor,
            hasMore,
        };
    }

    /**
     * Conditional UPDATE: bump only if `at` is strictly newer than the
     * stored value. Protects against stale events overwriting a fresher
     * activity timestamp from a later message processed first.
     */
    public async bumpLastActivityAt(
        conversationId: string,
        at: Date,
    ): Promise<void> {
        await this._repo
            .getRepository()
            .createQueryBuilder()
            .update(ConversationModel)
            .set({ lastActivityAt: at })
            .where('id = :id AND last_activity_at < :at', {
                id: conversationId,
                at,
            })
            .execute();
    }
}

function clampLimit(input: number | undefined): number {
    const n = input ?? DEFAULT_LIMIT;
    if (!Number.isInteger(n) || n <= 0) {
        throw new BadRequestException('limit must be a positive integer');
    }
    return Math.min(n, MAX_LIMIT);
}

function decodeCursor(raw: string | undefined): InboxCursor | null {
    if (!raw) return null;
    try {
        const json = Buffer.from(raw, 'base64url').toString('utf8');
        const parsed = JSON.parse(json) as InboxCursor;
        if (typeof parsed.a !== 'string' || typeof parsed.i !== 'string') {
            throw new Error('shape');
        }
        // Reject obviously malformed timestamps.
        if (Number.isNaN(Date.parse(parsed.a))) throw new Error('ts');
        return parsed;
    } catch {
        throw new BadRequestException('Invalid cursor');
    }
}

function encodeCursor(c: InboxCursor): string {
    return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}
