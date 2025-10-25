import { IKeycloakConfig } from './interfaces/keycloak-config.interface';

export const getKeycloakConfig = (): IKeycloakConfig => ({
    url: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    redirectUri: process.env.KEYCLOAK_REDIRECT_URI,
    logoutRedirectUri: process.env.KEYCLOAK_LOGOUT_REDIRECT_URI,
    postLogoutRedirectUri: process.env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI,
});
