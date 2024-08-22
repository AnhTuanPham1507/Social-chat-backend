import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    ITokenPayload,
    ITokenResponse,
    ITokenService,
} from 'src/core/interfaces/token-service.interface';

@Injectable()
export class JWTService implements ITokenService {
    constructor(private jwtService: JwtService) {}

    generatePairToken(payload: ITokenPayload): ITokenResponse {
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_TOKEN_EXPIRE,
        });

        const refreshToken = this.jwtService.sign(
            { accessToken },
            { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE },
        );

        return {
            accessToken,
            refreshToken,
        } as ITokenResponse;
    }
}
