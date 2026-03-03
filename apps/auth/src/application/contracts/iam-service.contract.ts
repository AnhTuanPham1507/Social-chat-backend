
import { ExchangeTokenInput } from '../dtos/auth.dto';

export const IAM_SERVICE_TOKEN = Symbol('IAM_SERVICE_TOKEN');

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
}

export interface IIAMService {
    getLogoutUrl(idToken: string, redirectUri: string, clientId: string): string;
    getAuthorizationUrl(clientId: string, redirectUri: string, scope?: string): Promise<string>;
    exchangeCodeForToken(payload: ExchangeTokenInput): Promise<AuthTokens>;
    verifyToken<T>(token: string): Promise<T>;
}
