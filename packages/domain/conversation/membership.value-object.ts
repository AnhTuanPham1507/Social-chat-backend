import { PARTICIPANT_ROLE } from './participant-role.enum';

export class Membership {
    constructor(
        public readonly userId: string,
        public readonly role: PARTICIPANT_ROLE,
        public readonly joinedAt: Date,
    ) {
        if (!userId) {
            throw new Error('Membership.userId is required');
        }
    }

    withRole(newRole: PARTICIPANT_ROLE): Membership {
        return new Membership(this.userId, newRole, this.joinedAt);
    }

    equals(other: Membership): boolean {
        if (!other) return false;
        return (
            this.userId === other.userId &&
            this.role === other.role &&
            this.joinedAt.getTime() === other.joinedAt.getTime()
        );
    }
}
