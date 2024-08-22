import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ILoginUseCase } from '../use-cases/login.use-case';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { LoginPayloadDTO } from 'src/core/dtos/login-payload.dto';
import UserDTO from 'src/core/dtos/user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(DIToken.LOGIN_USE_CASE)
        private readonly loginUseCase: ILoginUseCase,
    ) {
        super({ usernameField: 'email' });
    }

    async validate(email: string, password: string): Promise<UserDTO> {
        const loginPayload: LoginPayloadDTO = { email, password };
        const user = await this.loginUseCase.execute(loginPayload);
        return user;
    }
}
