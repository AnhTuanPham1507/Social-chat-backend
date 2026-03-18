import { IKeycloakConfig } from './interfaces/keycloak-config.interface';

/**
 * Constructs the Keycloak auth callback URI.
 * Supports two approaches:
 * 1. Direct: KEYCLOAK_AUTH_CALLBACK_URL=http://example.com/auth/callback
 * 2. From APP_URL: APP_URL=http://example.com (will construct /auth/callback)
 */
function getKeycloakAuthCallbackUri(): string {
    // If KEYCLOAK_AUTH_CALLBACK_URL is explicitly set, use it
    if (process.env.KEYCLOAK_AUTH_CALLBACK_URL) {
        return process.env.KEYCLOAK_AUTH_CALLBACK_URL;
    }

    // Otherwise, construct from APP_URL if available
    if (process.env.APP_URL) {
        const baseUrl = process.env.APP_URL.replace(/\/$/, ''); // Remove trailing slash
        return `${baseUrl}/auth/auth/callback`;
    }

    // Fallback: throw error if neither is provided
    throw new Error(
        'Either KEYCLOAK_AUTH_CALLBACK_URL or APP_URL must be set in environment variables',
    );
}

export const getSocialChatKeycloakConfig = (): IKeycloakConfig => {
    return {
        url: process.env.KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        keycloakAuthCallbackUri: getKeycloakAuthCallbackUri(),
        clientId: process.env.KEYCLOAK_SOCIAL_ID,
        clientSecret: process.env.KEYCLOAK_SOCIAL_SECRET,
    };
};
