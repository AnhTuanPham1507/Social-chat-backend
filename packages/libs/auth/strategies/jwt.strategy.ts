import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { AuthUserDto, IAccessTokenPayload } from '../dtos/jwt-payload.dto';
import { KeycloakApiClient } from '../services/keycloak.service';
import { BaseUserRepository, REDIS_SERVICE_TOKEN, RedisBaseService, SharedStoreKeyHelper } from '@social-chat/infrastructure';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    private readonly _logger = new Logger(JwtStrategy.name);

    constructor(
        private readonly keycloakService: KeycloakApiClient,
        @Inject(REDIS_SERVICE_TOKEN.SHARED_STORE_SERVICE)
        private readonly _sharedStoreService: RedisBaseService,
        private readonly _userRepository: BaseUserRepository,
    ) {
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

        const userProfile = await this._fetchUserProfile(tokenPayload.sub, tokenPayload.email);

        return new AuthUserDto({
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.fullName,
            avatarUrl: userProfile.avatarUrl,
            phone: userProfile.phone,
            roles: tokenPayload.realm_access?.roles ?? [],
        });
    }

    private _extractTokenFromCookie(req: Request): string | null {
        const token = req.cookies?.accessToken;
        return token ?? null;
    }

    private async _fetchUserProfile(id: string, email: string): Promise<Record<string, any> | null> {
        // Try Redis shared store first
        try {
            const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(id);
            const cached = await this._sharedStoreService.hgetall(userInfoKey);
            if (cached) {
                return cached;
            }
        } catch (error) {
            this._logger.warn(`Redis lookup failed for user ${email}`, error);
        }

        // Fallback to database
        try {
            const userModel = await this._userRepository.findOne({email});
            if (userModel) {
                // Populate cache for next time
                const userInfoKey = SharedStoreKeyHelper.getUserInfoKey(id);
                await this._sharedStoreService.hset(userInfoKey, userModel as Record<string, any>).catch(() => {});
                return userModel as Record<string, any>;
            }
        } catch (error) {
            this._logger.warn(`DB lookup failed for user ${email}`, error);
        }

        return null;
    }
}
