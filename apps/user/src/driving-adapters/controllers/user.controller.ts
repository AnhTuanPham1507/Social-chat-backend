import { Body, Controller, Get, Inject, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import USER_ENDPOINT from '../constants/endpoint.constant';
import { JwtGuard } from '@social-chat/common';
import { Request } from 'express';
import { IUserApplicationService, USER_APPLICATION_SERVICE_TOKEN } from '@application/services/user.application-service';
import { UserDTO } from '@driving-adapters/dtos/user.dto';
import { UpdateProfileDto } from '@driving-adapters/dtos/update-profile.dto';
import { UserMapper } from '@driving-adapters/mappers/user.mapper';

@Controller(USER_ENDPOINT.BASE)
@ApiTags('Users')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class UserController {
    constructor(
        @Inject(USER_APPLICATION_SERVICE_TOKEN)
        private readonly _userApplicationService: IUserApplicationService,
    ) {}

    @Get(USER_ENDPOINT.PROFILE)
    @ApiOkResponse({ type: UserDTO, description: 'User profile retrieved successfully' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getUserProfile(@Req() req: Request & { user?: any }): Promise<UserDTO> {
        const email = req.user?.email as string;

        const user = await this._userApplicationService.getUserProfile(email);
        return UserMapper.fromAppModelToDTO(user);
    }

    @Patch(USER_ENDPOINT.PROFILE)
    @ApiOkResponse({ type: UserDTO, description: 'User profile updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async updateUserProfile(
        @Req() req: Request & { user?: any },
        @Body() dto: UpdateProfileDto,
    ): Promise<UserDTO> {
        const email = req.user?.email as string;

        const user = await this._userApplicationService.updateUserProfile(email, dto);
        return UserMapper.fromAppModelToDTO(user);
    }
}

