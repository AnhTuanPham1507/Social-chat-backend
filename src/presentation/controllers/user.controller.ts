import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiInternalServerErrorResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import CreateUserDTO from 'src/core/dtos/create-user.dto';
import UserDTO from 'src/core/dtos/user.dto';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { ICreateUserUseCase } from 'src/core/use-cases/user/create-user.use-case';

@Controller('api/v1/user')
@ApiTags('User')
export class UserController {
    constructor(
        @Inject(DIToken.CREATE_USER_USE_CASE)
        public readonly createUserUseCase: ICreateUserUseCase,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
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
    async createUser(@Body() payload: CreateUserDTO): Promise<UserDTO> {
        return this.createUserUseCase.execute(payload);
    }
}
