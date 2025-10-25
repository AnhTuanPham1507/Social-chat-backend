export const KEYCLOAK_CONFIG = 'KEYCLOAK_CONFIG';

export type IKeycloakConfig = {
    url: string;
    realm: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    logoutRedirectUri: string;
    postLogoutRedirectUri: string;
};
