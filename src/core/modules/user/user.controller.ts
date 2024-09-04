import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Req,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiConsumes,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import CreateUserDTO from '../../dtos/create-user.dto';
import UserDTO from '../../dtos/user.dto';
import { DIToken } from '../../enums/di-tokens.enum';
import { ICreateUserUseCase } from './use-cases/create-user.use-case';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadInterceptor } from 'src/core/interceptors/fileUpload.interceptor';
import { UploadedAssetDTO } from 'src/core/dtos/uploadedAsset.dto';

@Controller('api/v1/user')
@ApiTags('User')
export class UserController {
    constructor(
        @Inject(DIToken.CREATE_USER_USE_CASE)
        public readonly createUserUseCase: ICreateUserUseCase,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiConsumes('multipart/form-data')
    @ApiOkResponse({
        type: UserDTO,
        description: 'Tạo tài khoản thành công',
    })
    @ApiBadRequestResponse({
        description: 'Thông tin gửi lên không hợp lệ',
    })
    @ApiInternalServerErrorResponse({
        description: 'Xảy ra lỗi không xác thực',
    })
    @UseInterceptors(FileInterceptor('avatar'), FileUploadInterceptor)
    async createUser(@Req() request, @Body() payload: CreateUserDTO): Promise<UserDTO> {
        payload.uploadedAvatar = request.uploadedFile;
        return this.createUserUseCase.execute(payload);
    }
}
