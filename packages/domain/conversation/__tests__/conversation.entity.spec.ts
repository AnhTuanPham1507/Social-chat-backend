import {
    CONVERSATION_TYPE,
    ConversationCreatedEvent,
    ConversationEntity,
    GROUP_MEMBER_CAP,
    PARTICIPANT_ROLE,
} from '../../index';

describe('ConversationEntity', () => {
    const userA = '11111111-1111-4111-8111-111111111111';
    const userB = '22222222-2222-4222-8222-222222222222';
    const userC = '33333333-3333-4333-8333-333333333333';

    describe('createDM', () => {
        it('creates a DM with exactly two members, both with role MEMBER', () => {
            const conv = ConversationEntity.createDM(userA, userB);

            expect(conv.type).toBe(CONVERSATION_TYPE.DIRECT);
            expect(conv.isDM).toBe(true);
            expect(conv.isGroup).toBe(false);
            expect(conv.name).toBeNull();
            expect(conv.members.length).toBe(2);
            expect(conv.members.every((m) => m.role === PARTICIPANT_ROLE.MEMBER)).toBe(true);
            expect(conv.memberIds().sort()).toEqual([userA, userB].sort());
        });

        it('throws when user IDs are identical (no self-DM)', () => {
            expect(() => ConversationEntity.createDM(userA, userA)).toThrow(/yourself/i);
        });

        it('emits a ConversationCreatedEvent', () => {
            const conv = ConversationEntity.createDM(userA, userB);
            const events = conv.publishEvents();

            expect(events.length).toBe(1);
            expect(events[0]).toBeInstanceOf(ConversationCreatedEvent);
            const ev = events[0] as ConversationCreatedEvent;
            expect(ev.conversationId).toBe(conv.id);
            expect(ev.type).toBe(CONVERSATION_TYPE.DIRECT);
            expect(ev.memberIds.sort()).toEqual([userA, userB].sort());
        });
    });

    describe('createGroup', () => {
        it('creates a group with creator as OWNER and others as MEMBER', () => {
            const conv = ConversationEntity.createGroup({
                creatorId: userA,
                name: 'Squad',
                additionalMemberIds: [userB, userC],
            });

            expect(conv.type).toBe(CONVERSATION_TYPE.GROUP);
            expect(conv.name).toBe('Squad');
            expect(conv.members.length).toBe(3);

            const creator = conv.members.find((m) => m.userId === userA);
            const others = conv.members.filter((m) => m.userId !== userA);
            expect(creator?.role).toBe(PARTICIPANT_ROLE.OWNER);
            expect(others.every((m) => m.role === PARTICIPANT_ROLE.MEMBER)).toBe(true);
        });

        it('trims and rejects empty name', () => {
            expect(() =>
                ConversationEntity.createGroup({
                    creatorId: userA,
                    name: '',
                    additionalMemberIds: [userB],
                }),
            ).toThrow(/name/i);

            expect(() =>
                ConversationEntity.createGroup({
                    creatorId: userA,
                    name: '   ',
                    additionalMemberIds: [userB],
                }),
            ).toThrow(/name/i);
        });

        it('rejects when additionalMemberIds includes the creator', () => {
            expect(() =>
                ConversationEntity.createGroup({
                    creatorId: userA,
                    name: 'Squad',
                    additionalMemberIds: [userA, userB],
                }),
            ).toThrow(/creator/i);
        });

        it('dedupes additionalMemberIds', () => {
            const conv = ConversationEntity.createGroup({
                creatorId: userA,
                name: 'Squad',
                additionalMemberIds: [userB, userB, userC, userC],
            });

            expect(conv.memberIds().sort()).toEqual([userA, userB, userC].sort());
        });

        it('rejects when total members exceed the cap', () => {
            const tooMany = Array.from(
                { length: GROUP_MEMBER_CAP },
                (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
            );

            expect(() =>
                ConversationEntity.createGroup({
                    creatorId: userA,
                    name: 'Huge',
                    additionalMemberIds: tooMany,
                }),
            ).toThrow(new RegExp(String(GROUP_MEMBER_CAP)));
        });

        it('emits a ConversationCreatedEvent with creatorId set', () => {
            const conv = ConversationEntity.createGroup({
                creatorId: userA,
                name: 'Squad',
                additionalMemberIds: [userB, userC],
            });

            const events = conv.publishEvents();
            expect(events.length).toBe(1);
            const ev = events[0] as ConversationCreatedEvent;
            expect(ev.creatorId).toBe(userA);
            expect(ev.type).toBe(CONVERSATION_TYPE.GROUP);
        });
    });

    describe('hasMember / memberIds', () => {
        it('returns true for members of the conversation, false otherwise', () => {
            const conv = ConversationEntity.createDM(userA, userB);
            expect(conv.hasMember(userA)).toBe(true);
            expect(conv.hasMember(userB)).toBe(true);
            expect(conv.hasMember(userC)).toBe(false);
        });
    });
});
