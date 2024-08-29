import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { DIToken } from "src/core/enums/di-tokens.enum";
import { ITokenPayload, ITokenService } from "src/core/interfaces/token-service.interface";
import { IGoogleLoginUseCase } from "../use-cases/google-login.use-case";
import { GoogleLoginPayloadDTO } from "src/core/dtos/gogole-login-payload.dto";
import { ResponseLoginDTO } from "src/core/dtos/response-login.dto";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        @Inject(DIToken.GOOGLE_LOGIN_USE_CASE)
        private readonly loginUseCase: IGoogleLoginUseCase,

        @Inject(DIToken.TOKEN_SERVICE)
        private readonly tokenService: ITokenService,
    ) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
    ): Promise<ResponseLoginDTO> {
        const user = await this.loginUseCase.execute(profile._json as GoogleLoginPayloadDTO);

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