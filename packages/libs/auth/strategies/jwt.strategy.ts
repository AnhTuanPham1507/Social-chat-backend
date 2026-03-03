import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { IAccessTokenPayload } from '../dtos/jwt-payload.dto';
import { KeycloakApiClient } from '../services/keycloak.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly keycloakService: KeycloakApiClient,
    ) {
        super();
    }

    public async validate(req: Request): Promise<boolean> {
        const token = this._extractTokenFromCookie(req);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = await this.keycloakService.verifyToken<IAccessTokenPayload>(token);
            req['user'] = payload;

            return true;
        } catch (error) {
            return false;
        }
    }

    private _extractTokenFromCookie(req: Request): string | null {
        const token = req.cookies?.accessToken;
        return token ?? null;
    }
}
