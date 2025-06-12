import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthHelper {
    constructor(private readonly _jwtService: JwtService) {}

    generatePairToken(payload: Record<string, any>): {
        accessToken: string,
        refreshToken: string
    } {
        const accessToken = this._jwtService.sign(payload, {
            expiresIn: process.env.JWT_TOKEN_EXPIRE,    
        });

        const refreshToken = this._jwtService.sign(
            { accessToken },
            { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE },
        );

        return {
            accessToken,
            refreshToken,
        };
    }
}
