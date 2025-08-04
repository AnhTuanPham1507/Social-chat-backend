import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

import {
    AUTH_APPLICATION_SERVICE_TOKEN,
    IAuthApplicationService,
} from '../application/application-services/auth.application-service';
import { AuthHelper } from '../auth.helper';
import { GoogleLoginPayloadDTO } from '../driving-adapters/dtos/google-login-payload.dto';
import { ResponseLoginDTO } from '../driving-adapters/dtos/response-login.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        @Inject(AUTH_APPLICATION_SERVICE_TOKEN)
        private readonly _authService: IAuthApplicationService,
        private readonly _authHelper: AuthHelper,
    ) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
        });
    }

    public async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
    ): Promise<ResponseLoginDTO> {
        const user = await this._authService.googleLogin(
            profile._json as GoogleLoginPayloadDTO,
        );

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const pairToken =
            await this._authHelper.generatePairToken(tokenPayload);

        return new ResponseLoginDTO(
            pairToken.accessToken,
            pairToken.refreshToken,
        );
    }
}
