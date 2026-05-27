import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import {
    ConversationEntity,
    DOMAIN_EVENT_BUS_TOKEN,
    IDomainEventBus,
} from '@social-chat/domain';

import {
    CONVERSATION_REPO_TOKEN,
    IConversationRepository,
} from '../contracts/conversation-repository.contract';
import {
    IUserReadRepository,
    USER_READ_REPO_TOKEN,
} from '../contracts/user-read-repository.contract';
import {
    ConversationDTO,
    ConversationListItemDTO,
    ConversationPageDTO,
    CreateDMInput,
    CreateGroupInput,
    ListConversationsInput,
    ParticipantSnapshotDTO,
} from '../dtos/conversation.dto';
import { ConversationAppMapper } from '../mappers/conversation-app.mapper';

export const CONVERSATION_APPLICATION_SERVICE_TOKEN = Symbol(
    'CONVERSATION_APPLICATION_SERVICE_TOKEN',
);

const PG_UNIQUE_VIOLATION = '23505';
const DM_UNIQUE_INDEX = 'uniq_dm';

export interface IConversationApplicationService {
    createDM(currentUserId: string, input: CreateDMInput): Promise<{ conversation: ConversationDTO; existed: boolean }>;
    createGroup(currentUserId: string, input: CreateGroupInput): Promise<ConversationDTO>;
    listForUser(currentUserId: string, input: ListConversationsInput): Promise<ConversationPageDTO>;
}

@Injectable()
export class ConversationApplicationService implements IConversationApplicationService {
    constructor(
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _repo: IConversationRepository,
        @Inject(USER_READ_REPO_TOKEN)
        private readonly _userReadRepo: IUserReadRepository,
        @Inject(DOMAIN_EVENT_BUS_TOKEN)
        private readonly _domainEventBus: IDomainEventBus,
    ) {}

    public async createDM(
        currentUserId: string,
        input: CreateDMInput,
    ): Promise<{ conversation: ConversationDTO; existed: boolean }> {
        const memberIds = input.memberIds ?? [];
        if (memberIds.length !== 2) {
            throw new BadRequestException('DM requires exactly 2 members');
        }

        if (!memberIds.includes(currentUserId)) {
            throw new ForbiddenException('You can only create a DM that includes yourself');
        }

        const [a, b] = memberIds;
        const conversation = ConversationEntity.createDM(a, b);

        try {
            await this._repo.insert(conversation);
        } catch (err) {
            if (this.isDmUniqueViolation(err)) {
                const existing = await this._repo.findExistingDM(a, b);
                if (existing) {
                    return {
                        conversation: ConversationAppMapper.fromEntityToAppModel(existing),
                        existed: true,
                    };
                }
            }
            throw err;
        }

        const events = conversation.publishEvents();
        await this._domainEventBus.publishAll(events);

        return {
            conversation: ConversationAppMapper.fromEntityToAppModel(conversation),
            existed: false,
        };
    }

    public async createGroup(
        currentUserId: string,
        input: CreateGroupInput,
    ): Promise<ConversationDTO> {
        const memberIds = input.memberIds ?? [];
        if (!memberIds.includes(currentUserId)) {
            throw new ForbiddenException(
                'You can only create a group that includes yourself',
            );
        }

        const additionalMemberIds = memberIds.filter((id) => id !== currentUserId);

        const conversation = ConversationEntity.createGroup({
            creatorId: currentUserId,
            name: input.name,
            additionalMemberIds,
        });

        await this._repo.insert(conversation);

        const events = conversation.publishEvents();
        await this._domainEventBus.publishAll(events);

        return ConversationAppMapper.fromEntityToAppModel(conversation);
    }

    public async listForUser(
        currentUserId: string,
        input: ListConversationsInput,
    ): Promise<ConversationPageDTO> {
        const result = await this._repo.findByMemberId(currentUserId, {
            cursor: input.cursor,
            limit: input.limit,
        });

        // Collect every participant userId across the page and batch-look
        // up snapshots in one Mongo round-trip. CDC eventual-consistency
        // means an unknown id simply yields no snapshot — the client
        // degrades to displaying the raw userId.
        const allUserIds = new Set<string>();
        for (const c of result.items) {
            for (const m of c.members) allUserIds.add(m.userId);
        }
        const snapshots = await this._userReadRepo.findManyByIds([...allUserIds]);
        const byId = new Map<string, ParticipantSnapshotDTO>();
        for (const s of snapshots) {
            byId.set(s._id, {
                userId: s._id,
                displayName: s.displayName,
                avatarUrl: s.avatarUrl,
            });
        }

        const items: ConversationListItemDTO[] = result.items.map((entity) => {
            const baseDto = ConversationAppMapper.fromEntityToAppModel(entity);
            const participants: ParticipantSnapshotDTO[] = entity.memberIds()
                .map((id) => byId.get(id))
                .filter((s): s is ParticipantSnapshotDTO => s !== undefined);
            return { ...baseDto, participants };
        });

        return {
            items,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }

    private isDmUniqueViolation(err: unknown): boolean {
        if (!(err instanceof QueryFailedError)) return false;
        const driverErr = (err as QueryFailedError & { code?: string; constraint?: string });
        return (
            driverErr.code === PG_UNIQUE_VIOLATION &&
            driverErr.constraint === DM_UNIQUE_INDEX
        );
    }
}
