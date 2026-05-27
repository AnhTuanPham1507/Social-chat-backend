import { WsPushEvent } from '@social-chat/common';

export const WS_PUSH_PUBLISHER_TOKEN = Symbol('WS_PUSH_PUBLISHER_TOKEN');

/**
 * Outbound port for the WS back-channel.
 *
 * Fire-and-forget by contract: pub/sub drops if no subscriber is currently
 * connected to the target channel. Offline recoverability is a separate
 * concern handled by the notifications layer (story 6.4-B).
 *
 * Two channel families:
 *   - `publishToUser`         → user:{userId} — targeted at one user
 *   - `publishToConversation` → conversation:{convId} — broadcast to all
 *                                conversation members connected anywhere
 */
export interface IWsPushPublisher {
    publishToUser(userId: string, event: WsPushEvent): Promise<void>;
    publishToConversation(conversationId: string, event: WsPushEvent): Promise<void>;
}
