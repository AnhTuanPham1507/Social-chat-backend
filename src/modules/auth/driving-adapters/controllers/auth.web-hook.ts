import {
    Controller,
    Get,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
} from '@nestjs/swagger';

import { Response } from 'express';
import { GoogleOAuthGuard } from '@commons/guards/google.guard';
import ENDPOINT from '@modules/auth/constants/endpoint.constant';

@Controller(ENDPOINT.WEB_HOOK.BASE)
@ApiTags('Auth')
export class AuthWebHook {
    constructor() {}

    @Get(ENDPOINT.WEB_HOOK.GOOGLE_REDIRECT)
    @UseGuards(GoogleOAuthGuard)
    googleAuthRedirect(@Request() req, @Res() res: Response): void {
        res.cookie('accessToken', req.user.accessToken, {
            httpOnly: true, // Ensures the cookie is not accessible via JavaScript
            secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent only over HTTPS in production
            sameSite: 'strict', // Controls whether the cookie is sent with cross-site requests
            maxAge: 3600000, // Cookie expiration time in milliseconds (1 hour here)
        });

        res.cookie('refreshToken', req.user.refreshToken, {
            httpOnly: true, // Ensures the cookie is not accessible via JavaScript
            secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent only over HTTPS in production
            sameSite: 'strict', // Controls whether the cookie is sent with cross-site requests
            maxAge: 7200000, // Cookie expiration time in milliseconds (1 hour here)
        });

        res.json({ message: 'Đăng nhập thành công' });
    }
}
