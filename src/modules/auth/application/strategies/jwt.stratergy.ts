import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

import { JwtService } from '../services/jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly _jwtService: JwtService) {
        super();
    }

    public async validate(req: Request): Promise<void> {
        const token = this._extractTokenFromHeader(req);
        if (!token) {
            throw new UnauthorizedException();
        }

        const payload = await this._jwtService.verifyToken(token);
        req.user = payload;
    }

    private _extractTokenFromHeader(req: Request): string | null {
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
    }
}
