/**
 * Consumer group for `messaging.commands` topic.
 *
 * One group across all command types (send-text, future: send-image / edit /
 * delete) so the consumer instance is the single owner of each partition's
 * offsets. Splitting groups per command type would waste broker bandwidth —
 * every group would read every message and discard most of them.
 */
export const MESSAGING_COMMANDS_GROUP_ID = 'messaging-commands-consumer-group';
