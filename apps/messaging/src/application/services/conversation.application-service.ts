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
    ConversationDTO,
    CreateDMInput,
    CreateGroupInput,
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
}

@Injectable()
export class ConversationApplicationService implements IConversationApplicationService {
    constructor(
        @Inject(CONVERSATION_REPO_TOKEN)
        private readonly _repo: IConversationRepository,
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

    private isDmUniqueViolation(err: unknown): boolean {
        if (!(err instanceof QueryFailedError)) return false;
        const driverErr = (err as QueryFailedError & { code?: string; constraint?: string });
        return (
            driverErr.code === PG_UNIQUE_VIOLATION &&
            driverErr.constraint === DM_UNIQUE_INDEX
        );
    }
}
