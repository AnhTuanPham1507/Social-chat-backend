import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    ITokenService,
} from 'src/core/interfaces/token-service.interface';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { LoginPayloadDTO } from 'src/core/dtos/login-payload.dto';
import { LocalGuard } from './guards/local.guard';
import { GoogleOAuthGuard } from './guards/google.guard';
import { Response } from 'express';
@Controller('api/v1/auth')
@ApiTags('Auth')
export class AuthController {
    constructor(
        @Inject(DIToken.TOKEN_SERVICE)
        public readonly tokenService: ITokenService,
    ) {}
    @Post('login')
    @UseGuards(LocalGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBody({
        type: LoginPayloadDTO,
    })
    @ApiOkResponse({
        type: LoginPayloadDTO,
        description: 'Đăng nhập thành công',
    })
    @ApiUnauthorizedResponse({
        description: 'Xác thực danh tính thất bại',
    })
    @ApiBadRequestResponse({
        description: 'Thông tin gửi lên không hợp lệ',
    })
    @ApiInternalServerErrorResponse({
        description: 'Xảy ra lỗi không xác thực',
    })
    login(@Request() req, @Res() res: Response): void {
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

        res.json({message: 'Đăng nhập thành công'});
    }

    @Get('login/google')
    @UseGuards(GoogleOAuthGuard)
     googleAuth() {}

    @Get('login/google/redirect')
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
