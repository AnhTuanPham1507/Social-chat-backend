import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';

import {
    CONVERSATION_TYPE,
    ConversationEntity,
    DOMAIN_EVENT_BUS_TOKEN,
    IDomainEventBus,
    PARTICIPANT_ROLE,
} from '@social-chat/domain';

import {
    CONVERSATION_REPO_TOKEN,
    IConversationRepository,
} from '../../contracts/conversation-repository.contract';
import { ConversationApplicationService } from '../conversation.application-service';

describe('ConversationApplicationService', () => {
    const userA = '11111111-1111-4111-8111-111111111111';
    const userB = '22222222-2222-4222-8222-222222222222';
    const userC = '33333333-3333-4333-8333-333333333333';

    let service: ConversationApplicationService;
    let repo: jest.Mocked<IConversationRepository>;
    let eventBus: jest.Mocked<IDomainEventBus>;

    beforeEach(async () => {
        repo = {
            insert: jest.fn(),
            findById: jest.fn(),
            findExistingDM: jest.fn(),
        };
        eventBus = {
            publish: jest.fn(),
            publishAll: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConversationApplicationService,
                { provide: CONVERSATION_REPO_TOKEN, useValue: repo },
                { provide: DOMAIN_EVENT_BUS_TOKEN, useValue: eventBus },
            ],
        }).compile();

        service = module.get(ConversationApplicationService);
    });

    describe('createDM', () => {
        it('creates a new DM and publishes events', async () => {
            repo.insert.mockResolvedValue();

            const result = await service.createDM(userA, { memberIds: [userA, userB] });

            expect(result.existed).toBe(false);
            expect(result.conversation.type).toBe(CONVERSATION_TYPE.DIRECT);
            expect(result.conversation.members.length).toBe(2);
            expect(repo.insert).toHaveBeenCalledTimes(1);
            expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
        });

        it('rejects when memberIds.length !== 2', async () => {
            await expect(
                service.createDM(userA, { memberIds: [userA] }),
            ).rejects.toThrow(BadRequestException);

            await expect(
                service.createDM(userA, { memberIds: [userA, userB, userC] }),
            ).rejects.toThrow(BadRequestException);
        });

        it('rejects when caller is not in memberIds', async () => {
            await expect(
                service.createDM(userC, { memberIds: [userA, userB] }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('recovers the existing DM when a uniq_dm violation is thrown (race-and-recover)', async () => {
            // Build the existing DM that the DB already has — race scenario.
            const existingDM = ConversationEntity.createDM(userA, userB);
            existingDM.publishEvents(); // drain so we don't accidentally compare

            // Simulate Postgres unique violation on insert.
            const pgError = new QueryFailedError(
                'INSERT INTO ...',
                [],
                new Error('duplicate key value violates unique constraint'),
            ) as QueryFailedError & { code: string; constraint: string };
            pgError.code = '23505';
            pgError.constraint = 'uniq_dm';

            repo.insert.mockRejectedValueOnce(pgError);
            repo.findExistingDM.mockResolvedValueOnce(existingDM);

            const result = await service.createDM(userA, { memberIds: [userA, userB] });

            expect(result.existed).toBe(true);
            expect(result.conversation.id).toBe(existingDM.id);
            expect(repo.findExistingDM).toHaveBeenCalledWith(userA, userB);
            // Crucially: events for the *new* (rejected) entity must NOT be published.
            expect(eventBus.publishAll).not.toHaveBeenCalled();
        });

        it('rethrows non-uniq_dm constraint violations', async () => {
            const pgError = new QueryFailedError(
                'INSERT INTO ...',
                [],
                new Error('some other constraint'),
            ) as QueryFailedError & { code: string; constraint: string };
            pgError.code = '23505';
            pgError.constraint = 'some_other_uniq';

            repo.insert.mockRejectedValueOnce(pgError);

            await expect(
                service.createDM(userA, { memberIds: [userA, userB] }),
            ).rejects.toBe(pgError);

            expect(repo.findExistingDM).not.toHaveBeenCalled();
        });

        it('rethrows non-unique-violation errors (e.g. connection error)', async () => {
            const otherError = new Error('connection refused');
            repo.insert.mockRejectedValueOnce(otherError);

            await expect(
                service.createDM(userA, { memberIds: [userA, userB] }),
            ).rejects.toBe(otherError);
        });
    });

    describe('createGroup', () => {
        it('creates a group with creator as OWNER', async () => {
            repo.insert.mockResolvedValue();

            const dto = await service.createGroup(userA, {
                name: 'Squad',
                memberIds: [userA, userB, userC],
            });

            expect(dto.type).toBe(CONVERSATION_TYPE.GROUP);
            expect(dto.name).toBe('Squad');

            const creator = dto.members.find((m) => m.userId === userA);
            expect(creator?.role).toBe(PARTICIPANT_ROLE.OWNER);

            const others = dto.members.filter((m) => m.userId !== userA);
            expect(others.every((m) => m.role === PARTICIPANT_ROLE.MEMBER)).toBe(true);
        });

        it('rejects when caller is not in memberIds', async () => {
            await expect(
                service.createGroup(userC, {
                    name: 'Squad',
                    memberIds: [userA, userB],
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('strips the creator from additional members (idempotent if creator is in memberIds)', async () => {
            repo.insert.mockResolvedValue();

            const dto = await service.createGroup(userA, {
                name: 'Squad',
                memberIds: [userA, userB], // creator included by frontend, normal case
            });

            // Total = creator (OWNER) + userB (MEMBER) = 2.
            expect(dto.members.length).toBe(2);
        });
    });
});
