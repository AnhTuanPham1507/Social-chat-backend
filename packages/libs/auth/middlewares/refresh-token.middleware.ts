import { Injectable, NestMiddleware, Inject, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

import { IAccessTokenPayload } from '../dtos/jwt-payload.dto';
import { KeycloakApiClient, KeycloakClientId } from '../services/keycloak.service';

export interface RefreshTokenMiddlewareOptions {
    expiryLeeway?: number;
    isProduction?: boolean;
}

export const REFRESH_TOKEN_OPTIONS = Symbol('REFRESH_TOKEN_OPTIONS');

@Injectable()
export class RefreshTokenMiddleware implements NestMiddleware {
    private readonly _logger = new Logger(RefreshTokenMiddleware.name);
    private readonly _expiryLeeway: number;
    private readonly _isProduction: boolean;

    constructor(
        private readonly keycloakApiClient: KeycloakApiClient,
        @Inject(REFRESH_TOKEN_OPTIONS)
        options: RefreshTokenMiddlewareOptions,
    ) {
        this._expiryLeeway = options.expiryLeeway ?? 10;
        this._isProduction = options.isProduction ?? false;
    }

    public async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken && this._isTokenExpired(accessToken)) {
            try {
                this._logger.debug('Access token expired, refreshing token');

                const clientId = req.headers['x-client-id'] as string | undefined;
                const tokensResult = await this.keycloakApiClient.refreshToken(
                    refreshToken,
                    clientId as KeycloakClientId,
                );

                req.cookies.accessToken = tokensResult.accessToken;
                req.cookies.refreshToken = tokensResult.refreshToken;

                res.cookie('idToken', tokensResult.idToken, {
                    httpOnly: true,
                    secure: this._isProduction,
                    maxAge: tokensResult.expiresIn * 1000,
                });
                res.cookie('accessToken', tokensResult.accessToken, {
                    httpOnly: true,
                    secure: this._isProduction,
                    maxAge: tokensResult.expiresIn * 1000,
                });
                res.cookie('refreshToken', tokensResult.refreshToken, {
                    httpOnly: true,
                    secure: this._isProduction,
                    maxAge: tokensResult.refreshExpiresIn * 1000,
                });

                this._logger.debug('Token refreshed successfully');
            } catch (error) {
                this._logger.error('Token refresh failed', error);
            }
        }

        next();
    }

    private _isTokenExpired(token?: string): boolean {
        if (!token) {
            return true;
        }

        try {
            const jwtPayload = jwt.decode(token, { complete: true });
            const payload = jwtPayload?.payload as IAccessTokenPayload;
            const exp = payload?.exp;

            if (!exp) {
                return true;
            }

            const now = Math.floor(Date.now() / 1000);
            return exp - now < this._expiryLeeway;
        } catch {
            return true;
        }
    }
}
