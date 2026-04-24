import {
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Body,
    Res,
    Req,
    Query,
    Get,
    BadRequestException,
} from '@nestjs/common';
import {  ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import {
    AUTH_APPLICATION_SERVICE_TOKEN,
    IAuthApplicationService,
} from '../../application/application-services/auth.application-service';
import ENDPOINT from '../../constants/endpoint.constant';
import { ExchangeTokenDTO } from '../dtos/auth.dto';
import { isProduction } from '@social-chat/common';
import { IAM_SERVICE_TOKEN, IIAMService } from '@application/contracts/iam-service.contract';
import { ExchangeTokenInput } from '@application/dtos/auth.dto';

@Controller(ENDPOINT.AUTH.BASE)
@ApiTags('Auth')
export class AuthController {
    constructor(
        @Inject(AUTH_APPLICATION_SERVICE_TOKEN)
        private readonly _authApplicationService: IAuthApplicationService,
        @Inject(IAM_SERVICE_TOKEN)
        private readonly _iamService: IIAMService,
    ) {}

    @Get(ENDPOINT.AUTH.LOGIN)
    @HttpCode(HttpStatus.OK)
    public async login(
        @Query('redirect_uri') redirectUri: string,
        @Query('client_id') clientId: string,
        @Res() res: Response,
    ): Promise<void> {
        if (!clientId) {
            throw new BadRequestException('X-Client-Id is required');
        }

        const authorizationUrl = await this._iamService.getAuthorizationUrl(
            clientId,
            redirectUri,
        );

        return res.redirect(authorizationUrl);
    }


    @Get(ENDPOINT.AUTH.LOGOUT)
    public async logout(
        @Res() res: Response,
        @Req() req: Request,
        @Query('redirect_uri') redirectUri: string,
        @Query('client_id') clientId: string,
    ): Promise<void> {
        if (!clientId) {
            throw new BadRequestException('X-Client-Id is required');
        }

        const idToken = req.cookies.idToken;

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('idToken');

        return res.redirect(
            this._iamService.getLogoutUrl(idToken, redirectUri, clientId),
        );
    }

    @Get(ENDPOINT.AUTH.CALLBACK)
    public async callback(
        @Query() query: ExchangeTokenDTO,
        @Res() res: Response,
    ): Promise<void> {
        if (query.code) {
            // Extract clientId from state or header (state takes precedence)
            const clientId = query.state?.clientId;
            const exchangeInput: ExchangeTokenInput = {
                ...query,
                state: {
                    redirectUri: query.state.redirectUri,
                    clientId,
                },
            } as ExchangeTokenInput;

            const result = await this._authApplicationService.authCallback(
                exchangeInput,
                clientId,
            );

            res.cookie('idToken', result.idToken, {
                httpOnly: true,
                secure: isProduction(),
                maxAge: result.expiresIn * 1000,
            });
            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: isProduction(),
                maxAge: result.expiresIn * 1000,
            });
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: isProduction(),
                maxAge: result.refreshExpiresIn * 1000,
            });
        }

        return res.redirect(query.state.redirectUri);
    }
}
