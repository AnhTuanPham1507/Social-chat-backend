import { GoogleOAuthGuard } from '@common/guards/google.guard';
import ENDPOINT from '@modules/auth/constants/endpoint.constant';
import {
    Controller,
    Get,
    Logger,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@Controller(ENDPOINT.WEB_HOOK.BASE)
@ApiTags('Auth')
export class AuthWebHook {
    private readonly logger = new Logger(AuthWebHook.name);
    constructor() {}

    @Get(ENDPOINT.WEB_HOOK.GOOGLE_REDIRECT)
    @UseGuards(GoogleOAuthGuard)
    public googleAuthRedirect(@Request() req, @Res() res: Response): void {
        if (!req.user) {
            this.logger.error('User not found');
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

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
