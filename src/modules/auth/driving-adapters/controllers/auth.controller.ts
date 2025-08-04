import { GoogleOAuthGuard } from '@common/guards/google.guard';
import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';
import { LoginPayloadDTO } from '@modules/auth/driving-adapters/dtos/login-payload.dto';
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
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiConsumes,
} from '@nestjs/swagger';
import { Response } from 'express';
import { LocalGuard } from 'src/common/guards/local.guard';

import {
    AUTH_APPLICATION_SERVICE_TOKEN,
    IAuthApplicationService,
} from '../../application/application-services/auth.application-service';
import ENDPOINT from '../../constants/endpoint.constant';
import RegisterPayloadDTO from '../dtos/register-payload.dto';

@Controller(ENDPOINT.AUTH.BASE)
@ApiTags('Auth')
export class AuthController {
    constructor(
        @Inject(AUTH_APPLICATION_SERVICE_TOKEN)
        private readonly _authApplicationService: IAuthApplicationService,
    ) {}

    @Post(ENDPOINT.AUTH.LOGIN)
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
    public login(@Request() req, @Res() res: Response): void {
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

    @Get(ENDPOINT.AUTH.GOOGLE_LOGIN)
    @UseGuards(GoogleOAuthGuard)
    public googleAuth() {}

    @Post(ENDPOINT.AUTH.REGISTER)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: RegisterPayloadDTO,
    })
    @UseInterceptors(FileInterceptor('avatar'))
    public async register(
        @Request() req,
        @UploadedFile() avatar: Express.Multer.File,
    ) {
        const userData = req.body;

        userData.avatar = {
            fileName: avatar.originalname,
            fileBuffer: avatar.buffer,
            fileSize: avatar.size,
            mimeType: avatar.mimetype as MIME_TYPE,
        };

        return this._authApplicationService.register(userData);
    }
}
