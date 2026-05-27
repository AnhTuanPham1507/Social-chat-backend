import { Injectable, Logger } from '@nestjs/common';

/**
 * Service-to-service HTTP client for the messaging app.
 *
 * Uses Node's native `fetch` (Node 18+) — no `@nestjs/axios` dep. Each call
 * is bounded by a 5s AbortController timeout so a stuck connection cannot
 * leak indefinitely.
 *
 * Authn: shared-secret header `x-internal-token` matching
 * `INTERNAL_SERVICE_TOKEN` on the messaging side. The gateway is trusted
 * to assert the `userId` (it JWT-verifies the WS handshake).
 *
 * Configuration via env:
 *   - MESSAGING_API_URL       (default http://localhost:3005)
 *   - INTERNAL_SERVICE_TOKEN  (must match the messaging service value)
 */
@Injectable()
export class MessagingApiClient {
    private readonly _logger = new Logger(MessagingApiClient.name);
    private readonly _baseUrl: string;
    private readonly _internalToken: string;

    constructor() {
        this._baseUrl =
            process.env.MESSAGING_API_URL ?? 'http://localhost:3005';
        this._internalToken = process.env.INTERNAL_SERVICE_TOKEN ?? '';
    }

    /**
     * Fire-and-forget POST to the read-ack fast-path. Caller may choose to
     * await or attach `.catch(...)` — failures are non-fatal (offline recovery
     * via the bulk participant-states fetch heals dropped acks).
     */
    async ackRead(
        userId: string,
        conversationId: string,
        lastReadMessageId: string,
    ): Promise<void> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5_000);

        try {
            const res = await fetch(
                `${this._baseUrl}/internal/messaging/read-ack`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'x-internal-token': this._internalToken,
                    },
                    body: JSON.stringify({
                        userId,
                        conversationId,
                        lastReadMessageId,
                    }),
                    signal: controller.signal,
                },
            );

            if (!res.ok) {
                const body = await res.text().catch(() => '');
                throw new Error(
                    `ackRead failed: ${res.status} ${res.statusText} ${body}`,
                );
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
