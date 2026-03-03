import {
    IKeycloakConfig,
    TokenResponseDTO,
} from '@social-chat/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwksClient } from 'jwks-rsa';
import { BaseApiClient } from '@social-chat/infrastructure';
import * as jwt from 'jsonwebtoken';

export enum KeycloakClientId {
    SOCIAL_CHAT = 'social-chat',
}

export type IKeycloakConfigs = {
    url: string;
    realm: string;
    keycloakAuthCallbackUri: string;
    [KeycloakClientId.SOCIAL_CHAT]: {
        clientId: string;
        clientSecret: string;
    };
}

@Injectable()
export class KeycloakApiClient extends BaseApiClient {
    private readonly jwksClient: JwksClient;
    private readonly keycloakConfigs: IKeycloakConfigs;

    constructor(keycloakConfig: IKeycloakConfig) {
        if (!keycloakConfig) {
            throw new Error('Keycloak configuration not provided');
        }

        super({
            baseURL: keycloakConfig.url,
            timeout: 10000,
            retryAttempts: 2,
        });

        // Load and cache both client configs
        this.keycloakConfigs = {
            url: keycloakConfig.url,
            realm: keycloakConfig.realm,
            keycloakAuthCallbackUri: keycloakConfig.keycloakAuthCallbackUri,
            [KeycloakClientId.SOCIAL_CHAT]: {
                clientId: keycloakConfig.clientId,
                clientSecret: keycloakConfig.clientSecret,
            }
        };

        this.jwksClient = new JwksClient({
            jwksUri: `${this.keycloakConfigs.url}/realms/${this.keycloakConfigs.realm}/protocol/openid-connect/certs`,
            cache: true,
            cacheMaxAge: 600000, // 10 minutes
            rateLimit: true,
            jwksRequestsPerMinute: 5,
        });
    }

    private getClientCredentials(clientId: KeycloakClientId): {
        clientId: string;
        clientSecret: string;
    } {
        const config = this.keycloakConfigs[clientId];
        
        if (!config) {
            throw new Error(`Client ${clientId} not found`);
        }

        return config;
    }

    public async refreshToken(
        refreshToken: string,
        clientId: KeycloakClientId,
    ): Promise<TokenResponseDTO> {
        const config = this.getClientCredentials(clientId);
        try {
            // Using new DTO transformation feature
            const { data } = await this.post(
                `/realms/${this.keycloakConfigs.realm}/protocol/openid-connect/token`,
                TokenResponseDTO, // DTO class for automatic transformation
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    refresh_token: refreshToken,
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            return data;
        } catch (error) {
            this.logger.error('Failed to refresh token', error);
            throw error;
        }
    }

    public async getPublicKey(kid: string): Promise<string> {
        try {
            const key = await this.jwksClient.getSigningKey(kid);

            return key.getPublicKey();
        } catch (error) {
            this.logger.error('Failed to get public key from Keycloak', error);
            throw error;
        }
    }

    public async verifyToken<T>(token: string): Promise<T> {
        const decoded = jwt.decode(token, { complete: true });
        const kid = decoded?.header?.kid;
        if (!kid) {
            throw new UnauthorizedException();
        }

        const publicKey = await this.getPublicKey(kid);
        if (!publicKey) {
            throw new UnauthorizedException();
        }

        return jwt.verify(token, publicKey) as T;
    }

    private async getAdminToken(clientId: KeycloakClientId): Promise<TokenResponseDTO> {
        const config = this.getClientCredentials(clientId);
        // Using new DTO transformation feature
        const { data } = await this.post(
            `/realms/${this.keycloakConfigs.realm}/protocol/openid-connect/token`,
            TokenResponseDTO, // DTO class for automatic transformation
            {
                grant_type: 'client_credentials',
                client_id: config.clientId,
                client_secret: config.clientSecret,
            },
        );

        return data;
    }

    public async exchangeCodeForToken(
        code: string,
        clientId: KeycloakClientId,
    ): Promise<TokenResponseDTO> {
        const config = this.getClientCredentials(clientId);
        // Using new DTO transformation feature
        const { data } = await this.post(
            `/realms/${this.keycloakConfigs.realm}/protocol/openid-connect/token`,
            TokenResponseDTO, // DTO class for automatic transformation
            new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code,
                redirect_uri: this.keycloakConfigs.keycloakAuthCallbackUri,
            }).toString(),
        );

        return data;
    }

    public getLogoutUrl(
        idToken: string,
        redirectUri: string,
        clientId: KeycloakClientId,
    ): string {
        const config = this.getClientCredentials(clientId);
        const params = new URLSearchParams({
            id_token_hint: idToken,
            post_logout_redirect_uri: redirectUri,
            client_id: config.clientId,
        });

        return `${this.keycloakConfigs.url}/realms/${this.keycloakConfigs.realm}/protocol/openid-connect/logout?${params}`;
    }

    public async globalLogout(
        keycloakUserId: string,
    ): Promise<void> {
        // because it is testing environment, any client can call this endpoint to logout any user
        const {accessToken} = await this.getAdminToken(KeycloakClientId.SOCIAL_CHAT);

        await this.post(
            `/admin/realms/${this.keycloakConfigs.realm}/users/${keycloakUserId}/logout`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );
    }

    public getAuthorizationUrl(
        clientId: KeycloakClientId,
        redirectUri: string,
        scope?: string,
    ): string {
        const config = this.getClientCredentials(clientId);
        const statePayload =  { redirect_uri: redirectUri, client_id: config.clientId };

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: this.keycloakConfigs.keycloakAuthCallbackUri,
            response_type: 'code',
            scope: scope || 'openid profile email',
            state: JSON.stringify(statePayload),
        });

        return `${this.keycloakConfigs.url}/realms/${this.keycloakConfigs.realm}/protocol/openid-connect/auth?${params}`;
    }
}
