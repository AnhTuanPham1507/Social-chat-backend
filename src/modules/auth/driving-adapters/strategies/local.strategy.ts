import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoginPayloadDTO } from 'src/modules/auth/driving-adapters/dtos/login-payload.dto';
import { ResponseLoginDTO } from 'src/modules/auth/driving-adapters/dtos/response-login.dto';
import { AuthHelper } from '../../auth.helper';
import { AUTH_APPLICATION_SERVICE_TOKEN, IAuthApplicationService } from '@modules/auth/application/application-services/auth.application-service';

export interface ILoginResponse {
    id: string;
    email: string;
    role: string;
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(AUTH_APPLICATION_SERVICE_TOKEN)
        private readonly _authService: IAuthApplicationService,
        private readonly _authHelper: AuthHelper
    ) {
        super({ usernameField: 'email' });
    }

    async validate(email: string, password: string): Promise<ResponseLoginDTO> {
        const loginPayload: LoginPayloadDTO = { email, password };
        const user = await this._authService.localLogin(loginPayload);

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const pairToken = await this._authHelper.generatePairToken(
            tokenPayload,
        );

        return new ResponseLoginDTO(
            pairToken.accessToken,
            pairToken.refreshToken,
        );    
    }
}
