export const GOOGLE_AUTH_CONFIG = 'GOOGLE_AUTH_CONFIG';

export interface IGoogleAuthConfig {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}