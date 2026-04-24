import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { AuthUserDto, IAccessTokenPayload } from '../dtos/jwt-payload.dto';
import { KeycloakApiClient } from '../services/keycloak.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly keycloakService: KeycloakApiClient) {
        super();
    }

    public async validate(req: Request): Promise<AuthUserDto> {
        const token = this._extractTokenFromCookie(req);
        if (!token) {
            throw new UnauthorizedException();
        }

        let tokenPayload: IAccessTokenPayload;
        try {
            tokenPayload = await this.keycloakService.verifyToken<IAccessTokenPayload>(token);
        } catch {
            throw new UnauthorizedException();
        }

        return new AuthUserDto({
            id: tokenPayload.sub,
            email: tokenPayload.email,
            name: tokenPayload.preferred_username,
            roles: tokenPayload.realm_access?.roles ?? [],
        });
    }

    private _extractTokenFromCookie(req: Request): string | null {
        const token = req.cookies?.accessToken;
        return token ?? null;
    }
}
