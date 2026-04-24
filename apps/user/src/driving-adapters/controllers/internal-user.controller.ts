import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiHeader } from '@nestjs/swagger';
import { IUserApplicationService, USER_APPLICATION_SERVICE_TOKEN } from '@application/services/user.application-service';
import { UserDTO } from '@driving-adapters/dtos/user.dto';
import { CreateUserDto } from '@driving-adapters/dtos/create-user.dto';
import { UserMapper } from '@driving-adapters/mappers/user.mapper';
import { ApiKeyGuard } from '@social-chat/shared-libs';

@Controller('internal/users')
@ApiTags('Internal - Users')
@UseGuards(ApiKeyGuard)
@ApiHeader({ name: 'x-api-key', required: true, description: 'Internal service API key' })
export class InternalUserController {
    constructor(
        @Inject(USER_APPLICATION_SERVICE_TOKEN)
        private readonly _userApplicationService: IUserApplicationService,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: UserDTO, description: 'User created successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiUnauthorizedResponse({ description: 'Invalid API key' })
    public async createUser(@Body() dto: CreateUserDto): Promise<UserDTO> {
        const user = await this._userApplicationService.createUser(dto);
        return UserMapper.fromAppModelToDTO(user);
    }
}
