export const SOCIAL_CHAT_KEYCLOAK_CONFIG = 'SOCIAL_CHAT_KEYCLOAK_CONFIG';

export type IKeycloakConfig = {
    url: string;
    realm: string;
    keycloakAuthCallbackUri: string;
    clientId: string;
    clientSecret: string;
};
