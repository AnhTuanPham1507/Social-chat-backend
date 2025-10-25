import {
    IKeycloakConfig,
    KEYCLOAK_CONFIG,
} from '@common/configs/interfaces/keycloak-config.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwksClient } from 'jwks-rsa';

import { BaseApiClient } from '../base-api-client';
import { KeycloakTokenResponseDTO, KeycloakUserInfoResponseDTO } from '../dtos';
import { CreateUserRequestDTO } from '../dtos/keycloak.dto';

@Injectable()
export class KeycloakApiClient extends BaseApiClient {
    private readonly jwksClient: JwksClient;
    private readonly keycloakConfig: IKeycloakConfig;

    constructor(private readonly configService: ConfigService) {
        const keycloakConfig =
            configService.get<IKeycloakConfig>(KEYCLOAK_CONFIG);

        super({
            baseURL: keycloakConfig.url,
            timeout: 10000,
            retryAttempts: 2,
        });

        this.keycloakConfig = keycloakConfig;
        this.jwksClient = new JwksClient({
            jwksUri: `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`,
            cache: true,
            cacheMaxAge: 600000, // 10 minutes
            rateLimit: true,
            jwksRequestsPerMinute: 5,
        });
    }

    public async createUser(user: CreateUserRequestDTO): Promise<void> {
        // TODO: cache token
        const token = await this.getAdminToken();

        // Using new DTO transformation feature - automatically transforms response to DTO class
        const response = await this.post(
            `/admin/realms/${this.keycloakConfig.realm}/users`,
            KeycloakUserInfoResponseDTO, // DTO class for automatic transformation
            {
                email: user.email,
                attributes: {
                    fullName: user.fullName,
                },
                enabled: true,
                emailVerified: false,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token.accessToken}`,
                },
            },
        );

        const location = response.headers.location;
        const userId = location.split('/').pop();

        await this.put(
            `/admin/realms/${this.keycloakConfig.realm}/users/${userId}/send-verify-email`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token.accessToken}`,
                },
            },
        );
    }

    private async getAdminToken(): Promise<KeycloakTokenResponseDTO> {
        // Using new DTO transformation feature
        const { data } = await this.post(
            `/realms/${this.keycloakConfig.realm}/protocol/openid-connect/token`,
            KeycloakTokenResponseDTO, // DTO class for automatic transformation
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.keycloakConfig.clientId,
                client_secret: this.keycloakConfig.clientSecret,
            }).toString(),
        );

        return data;
    }

    public async exchangeCodeForToken(
        code: string,
    ): Promise<KeycloakTokenResponseDTO> {
        // Using new DTO transformation feature
        const { data } = await this.post(
            `/realms/${this.keycloakConfig.realm}/protocol/openid-connect/token`,
            KeycloakTokenResponseDTO, // DTO class for automatic transformation
            new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.keycloakConfig.clientId,
                client_secret: this.keycloakConfig.clientSecret,
                code,
                redirect_uri: this.keycloakConfig.redirectUri,
            }).toString(),
        );

        return data;
    }

    public async refreshToken(
        refreshToken: string,
    ): Promise<KeycloakTokenResponseDTO> {
        try {
            // Using new DTO transformation feature
            const { data } = await this.post(
                `/realms/${this.keycloakConfig.realm}/protocol/openid-connect/token`,
                KeycloakTokenResponseDTO, // DTO class for automatic transformation
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: this.keycloakConfig.clientId,
                    client_secret: this.keycloakConfig.clientSecret,
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

    public async getUserInfo(
        userToken: string,
    ): Promise<KeycloakUserInfoResponseDTO> {
        try {
            // Using new DTO transformation feature
            const { data } = await this.get(
                `/realms/${this.keycloakConfig.realm}/protocol/openid-connect/userinfo`,
                KeycloakUserInfoResponseDTO, // DTO class for automatic transformation
                {
                    headers: {
                        ...this.withAuth(userToken),
                    },
                },
            );

            return data;
        } catch (error) {
            this.logger.error('Failed to get user info from Keycloak', error);
            throw error;
        }
    }

    public async logout(refreshToken: string) {
        try {
            const { data } = await this.post<void>(
                `/realms/${this.keycloakConfig.realm}/protocol/openid-connect/logout`,
                {
                    client_id: this.keycloakConfig.clientId,
                    client_secret: this.keycloakConfig.clientSecret,
                    refresh_token: refreshToken,
                },
            );

            return data;
        } catch (error) {
            this.logger.error('Failed to logout from Keycloak', error);
            throw error;
        }
    }

    public getAuthorizationUrl(
        state?: string,
        scope = 'openid profile email',
    ): string {
        const params = new URLSearchParams({
            client_id: this.keycloakConfig.clientId,
            redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
            response_type: 'code',
            scope,
            ...(state && { state }),
        });

        return `${this.keycloakConfig.url}/realms/${this.keycloakConfig.realm}/protocol/openid-connect/auth?${params}`;
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
}
