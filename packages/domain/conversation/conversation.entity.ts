import { AggregateRoot, UUID } from '../core/aggregate-root.base';
import { CONVERSATION_TYPE } from './conversation-type.enum';
import { PARTICIPANT_ROLE } from './participant-role.enum';
import { Membership } from './membership.value-object';
import { ConversationCreatedEvent } from './events/conversation-created.event';

export const GROUP_MEMBER_CAP = 1024;

interface ConversationProps {
    type: CONVERSATION_TYPE;
    name: string | null;
    members: Membership[];
    /**
     * Denormalised "last activity" timestamp for inbox sorting.
     *
     * Bumped by the application layer (out-of-band of the aggregate) on
     * every MessageSentEvent — see ConversationActivityListener. We model
     * it as a read-only entity prop so reads can project it, but mutation
     * is intentionally NOT exposed via an entity method: bumping it on
     * every message is hot-path, and loading the aggregate just to bump
     * a single column would contend on the conversation row for every
     * message in a busy DM. Repo does a direct UPDATE instead.
     */
    lastActivityAt: Date;
}

export interface CreateGroupProps {
    creatorId: string;
    name: string;
    additionalMemberIds: string[];
}

export interface ReconstituteConversationProps {
    id: UUID;
    type: CONVERSATION_TYPE;
    name: string | null;
    members: Membership[];
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export class ConversationEntity extends AggregateRoot<ConversationProps> {
    private constructor(props: ConversationProps, id?: UUID) {
        super(props, id);
    }

    static createDM(userIdA: string, userIdB: string): ConversationEntity {
        if (userIdA === userIdB) {
            throw new Error('Cannot create a DM with yourself');
        }

        const now = new Date();
        const members: Membership[] = [
            new Membership(userIdA, PARTICIPANT_ROLE.MEMBER, now),
            new Membership(userIdB, PARTICIPANT_ROLE.MEMBER, now),
        ];

        const conversation = new ConversationEntity({
            type: CONVERSATION_TYPE.DIRECT,
            name: null,
            members,
            lastActivityAt: now,
        });

        conversation.addDomainEvent(
            new ConversationCreatedEvent(
                conversation.id,
                CONVERSATION_TYPE.DIRECT,
                [userIdA, userIdB],
                userIdA,
            ),
        );

        return conversation;
    }

    static createGroup(props: CreateGroupProps): ConversationEntity {
        const trimmedName = props.name?.trim();
        if (!trimmedName) {
            throw new Error('Group conversation requires a name');
        }

        const otherIds = Array.from(new Set(props.additionalMemberIds ?? []));
        if (otherIds.includes(props.creatorId)) {
            throw new Error('additionalMemberIds must not include the creator');
        }

        const totalMembers = 1 + otherIds.length;
        if (totalMembers < 1) {
            throw new Error('Group conversation must have at least one member');
        }
        if (totalMembers > GROUP_MEMBER_CAP) {
            throw new Error(`Group conversation cannot exceed ${GROUP_MEMBER_CAP} members`);
        }

        const now = new Date();
        const members: Membership[] = [
            new Membership(props.creatorId, PARTICIPANT_ROLE.OWNER, now),
            ...otherIds.map(
                (userId) => new Membership(userId, PARTICIPANT_ROLE.MEMBER, now),
            ),
        ];

        const conversation = new ConversationEntity({
            type: CONVERSATION_TYPE.GROUP,
            name: trimmedName,
            members,
            lastActivityAt: now,
        });

        conversation.addDomainEvent(
            new ConversationCreatedEvent(
                conversation.id,
                CONVERSATION_TYPE.GROUP,
                members.map((m) => m.userId),
                props.creatorId,
            ),
        );

        return conversation;
    }

    static reconstitute(props: ReconstituteConversationProps): ConversationEntity {
        const conversation = new ConversationEntity(
            {
                type: props.type,
                name: props.name,
                members: props.members,
                lastActivityAt: props.lastActivityAt,
            },
            props.id,
        );
        conversation.setTimestamps(props.createdAt, props.updatedAt);
        return conversation;
    }

    get type(): CONVERSATION_TYPE {
        return this._props.type;
    }

    get name(): string | null {
        return this._props.name;
    }

    get members(): ReadonlyArray<Membership> {
        return this._props.members;
    }

    get lastActivityAt(): Date {
        return this._props.lastActivityAt;
    }

    get isDM(): boolean {
        return this._props.type === CONVERSATION_TYPE.DIRECT;
    }

    get isGroup(): boolean {
        return this._props.type === CONVERSATION_TYPE.GROUP;
    }

    hasMember(userId: string): boolean {
        return this._props.members.some((m) => m.userId === userId);
    }

    memberIds(): string[] {
        return this._props.members.map((m) => m.userId);
    }
}
