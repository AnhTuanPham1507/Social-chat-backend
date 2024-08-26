import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { DIToken } from "src/core/enums/di-tokens.enum";
import { ITokenService } from "src/core/interfaces/token-service.interface";
import { ILoginUseCase } from "../use-cases/login.use-case";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        @Inject(DIToken.LOGIN_USE_CASE)
        private readonly loginUseCase: ILoginUseCase,

        @Inject(DIToken.TOKEN_SERVICE)
        private readonly tokenService: ITokenService,
    ) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile']
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
      ): Promise<any> {        
        return profile;
    }
}