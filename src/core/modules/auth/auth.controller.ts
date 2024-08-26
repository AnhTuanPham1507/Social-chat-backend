import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Request,
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
import UserDTO from '../../dtos/user.dto';
import { ResponseLoginDTO } from 'src/core/dtos/response-login.dto';
import {
    ITokenPayload,
    ITokenService,
} from 'src/core/interfaces/token-service.interface';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { LoginPayloadDTO } from 'src/core/dtos/login-payload.dto';
import { LocalGuard } from './guards/local.guard';
import { GoogleOAuthGuard } from './guards/google.guard';

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
    async login(@Request() req): Promise<ResponseLoginDTO> {
        return req.user;
    }

    @Get('login/google')
    @UseGuards(GoogleOAuthGuard)
    async googleAuth(@Request() req) {
        console.log('hehehehe')
    }     

    @Get('login/google/redirect')
    @UseGuards(GoogleOAuthGuard)
    googleAuthRedirect(@Request() req) {
        console.log(req.user);
    }
}
