/**
 * Consumer group for `messaging.commands` topic.
 *
 * One group across all command types (send-text, future: send-image / edit /
 * delete) so the consumer instance is the single owner of each partition's
 * offsets. Splitting groups per command type would waste broker bandwidth —
 * every group would read every message and discard most of them.
 */
export const MESSAGING_COMMANDS_GROUP_ID = 'messaging-commands-consumer-group';

/**
 * Consumer groups for Debezium CDC topics consumed by messaging.
 *
 * Each group is messaging-scoped (`cdc-messaging-*`) so it has independent
 * offsets from the feed app reading the same source topic — a textbook
 * fan-out via consumer-group isolation.
 */
export const CDC_GROUP_ID = {
    USER: 'cdc-messaging-users-group-id',
};

/**
 * Debezium CDC topic names. The user table is the source of truth for the
 * messaging `users_view` projection.
 */
export const MESSAGING_CDC_TOPIC = {
    USER: 'social-chat-cdc.public.users',
};
