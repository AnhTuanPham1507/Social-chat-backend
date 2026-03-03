import { Injectable } from '@nestjs/common';

import { IIAMService } from '@application/contracts/iam-service.contract';
import { AuthTokens, ExchangeTokenInput } from '@application/dtos/auth.dto';
import { KeycloakApiClient, KeycloakClientId } from '@social-chat/shared-libs';

@Injectable()
export class IAMServiceAdapter implements IIAMService {
    constructor(private readonly keycloakService: KeycloakApiClient) {}

    public async exchangeCodeForToken(
        payload: ExchangeTokenInput,
    ): Promise<AuthTokens> {
        // Use clientId from state if not provided, otherwise use the parameter
        const activeClientId = payload.state.clientId;
        const keycloakTokens = await this.keycloakService.exchangeCodeForToken(
            payload.code,
            activeClientId as unknown as KeycloakClientId,
        );

        return {
            accessToken: keycloakTokens.accessToken,
            refreshToken: keycloakTokens.refreshToken,
            expiresIn: keycloakTokens.expiresIn,
            refreshExpiresIn: keycloakTokens.refreshExpiresIn,
            idToken: keycloakTokens.idToken,
        };
    }

    public getLogoutUrl(
        idToken: string,
        redirectUri: string,
        clientId: string,
    ): string {
        return this.keycloakService.getLogoutUrl(idToken, redirectUri, clientId as unknown as KeycloakClientId);
    }

    public async getAuthorizationUrl(
        clientId: string,
        redirectUri: string,
        scope?: string,
    ): Promise<string> {
       
        return this.keycloakService.getAuthorizationUrl(
            clientId as unknown as KeycloakClientId,
            redirectUri,
            scope
        );
    }

    public async verifyToken<T>(token: string): Promise<T> {
        return this.keycloakService.verifyToken(token);
    }
}
