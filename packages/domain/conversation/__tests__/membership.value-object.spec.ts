import { Membership, PARTICIPANT_ROLE } from '../../index';

describe('Membership (Value Object)', () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const joinedAt = new Date('2026-05-08T12:00:00Z');

    it('throws when userId is empty', () => {
        expect(() => new Membership('', PARTICIPANT_ROLE.MEMBER, joinedAt)).toThrow(/userId/);
    });

    it('exposes readonly fields (compile-time guarantee verified at runtime)', () => {
        const m = new Membership(userId, PARTICIPANT_ROLE.MEMBER, joinedAt);
        expect(m.userId).toBe(userId);
        expect(m.role).toBe(PARTICIPANT_ROLE.MEMBER);
        expect(m.joinedAt).toBe(joinedAt);
    });

    describe('withRole', () => {
        it('returns a NEW instance with the new role, leaving the original unchanged', () => {
            const original = new Membership(userId, PARTICIPANT_ROLE.MEMBER, joinedAt);
            const promoted = original.withRole(PARTICIPANT_ROLE.ADMIN);

            // Original VO is unchanged — VO immutability invariant.
            expect(original.role).toBe(PARTICIPANT_ROLE.MEMBER);
            expect(promoted.role).toBe(PARTICIPANT_ROLE.ADMIN);

            // Same userId and joinedAt are preserved.
            expect(promoted.userId).toBe(original.userId);
            expect(promoted.joinedAt).toBe(original.joinedAt);

            // Different reference identity (it's a new instance).
            expect(promoted).not.toBe(original);
        });
    });

    describe('equals', () => {
        it('returns true for VOs with the same fields', () => {
            const a = new Membership(userId, PARTICIPANT_ROLE.MEMBER, joinedAt);
            const b = new Membership(userId, PARTICIPANT_ROLE.MEMBER, new Date(joinedAt));
            expect(a.equals(b)).toBe(true);
        });

        it('returns false when role differs', () => {
            const a = new Membership(userId, PARTICIPANT_ROLE.MEMBER, joinedAt);
            const b = new Membership(userId, PARTICIPANT_ROLE.ADMIN, joinedAt);
            expect(a.equals(b)).toBe(false);
        });

        it('returns false against null/undefined', () => {
            const a = new Membership(userId, PARTICIPANT_ROLE.MEMBER, joinedAt);
            expect(a.equals(null as unknown as Membership)).toBe(false);
        });
    });
});
