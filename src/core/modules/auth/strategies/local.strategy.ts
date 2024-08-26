import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ILoginUseCase } from '../use-cases/login.use-case';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { LoginPayloadDTO } from 'src/core/dtos/login-payload.dto';
import { ITokenPayload, ITokenService } from 'src/core/interfaces/token-service.interface';
import { ResponseLoginDTO } from 'src/core/dtos/response-login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(DIToken.LOGIN_USE_CASE)
        private readonly loginUseCase: ILoginUseCase,

        @Inject(DIToken.TOKEN_SERVICE)
        private readonly tokenService: ITokenService,
    ) {
        super({ usernameField: 'email' });
    }

    async validate(email: string, password: string): Promise<ResponseLoginDTO> {
        const loginPayload: LoginPayloadDTO = { email, password };
        const user = await this.loginUseCase.execute(loginPayload);

        const tokenPayload: ITokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const pairToken = await this.tokenService.generatePairToken(
            tokenPayload,
        );

        return new ResponseLoginDTO(
            pairToken.accessToken,
            pairToken.refreshToken,
        );
    }
}
