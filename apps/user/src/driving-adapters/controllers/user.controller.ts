import { Body, Controller, Get, Inject, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiBearerAuth, ApiBadRequestResponse } from '@nestjs/swagger';
import USER_ENDPOINT from '../../constants/endpoint.constant';
import { IUserApplicationService, USER_APPLICATION_SERVICE_TOKEN } from '@application/services/user.application-service';
import {
    IUserSearchQueryApplicationService,
    USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN,
} from '@application/services/user-search-query.application-service';
import { UserDTO } from '@driving-adapters/dtos/user.dto';
import { UpdateProfileDto } from '@driving-adapters/dtos/update-profile.dto';
import { GetUsersQueryDto } from '@driving-adapters/dtos/get-users-query.dto';
import { PaginatedUsersResponseDto } from '@driving-adapters/dtos/paginated-users-response.dto';
import {
    UserSearchQueryDto,
    PaginatedSearchUsersDTO,
} from '@driving-adapters/dtos/user-search-query.dto';
import {
    UserAutocompleteQueryDto,
    UserAutocompleteSuggestionDto,
} from '@driving-adapters/dtos/user-autocomplete-query.dto';
import { UserMapper } from '@driving-adapters/mappers/user.mapper';
import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

@Controller(USER_ENDPOINT.BASE)
@ApiTags('Users')
export class UserController {
    constructor(
        @Inject(USER_APPLICATION_SERVICE_TOKEN)
        private readonly _userApplicationService: IUserApplicationService,
        @Inject(USER_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _userSearchService: IUserSearchQueryApplicationService,
    ) {}

    @Get()
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOkResponse({ type: PaginatedUsersResponseDto, description: 'List of users retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getAllUsers(
        @CurrentUser('id') userId: string,
        @Query() query: GetUsersQueryDto,
    ): Promise<PaginatedUsersResponseDto> {
        const result = await this._userApplicationService.getAllUsers({
            page: query.page,
            limit: query.limit,
            search: query.search,
            currentUserId: userId,
        });

        return {
            data: result.data.map(UserMapper.fromAppModelToDTO),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    @Get(USER_ENDPOINT.SEARCH)
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOkResponse({ type: PaginatedSearchUsersDTO, description: 'Search results returned successfully' })
    @ApiBadRequestResponse({ description: 'Invalid search query' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async searchUsers(
        @CurrentUser('id') userId: string,
        @Query() query: UserSearchQueryDto,
    ): Promise<PaginatedSearchUsersDTO> {
        const searchAfter = decodeSearchAfter(query.searchAfter);

        const result = await this._userSearchService.searchUsers(
            userId,
            query.q,
            query.size,
            searchAfter,
        );

        return {
            items: result.items.map(UserMapper.fromAppModelToDTO),
            total: result.total,
            hasMore: result.hasMore,
            nextSearchAfter: result.nextSearchAfter
                ? encodeSearchAfter(result.nextSearchAfter)
                : null,
        };
    }

    @Get(USER_ENDPOINT.AUTOCOMPLETE)
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOkResponse({ type: [UserAutocompleteSuggestionDto], description: 'Autocomplete suggestions' })
    @ApiBadRequestResponse({ description: 'Invalid query' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async autocompleteUsers(
        @CurrentUser('id') userId: string,
        @Query() query: UserAutocompleteQueryDto,
    ): Promise<UserAutocompleteSuggestionDto[]> {
        return this._userSearchService.autocomplete(userId, query.q, query.size);
    }

    @Get(USER_ENDPOINT.PROFILE)
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDTO, description: 'User profile retrieved successfully' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getUserProfile(@CurrentUser('email') email: string): Promise<UserDTO> {
        const user = await this._userApplicationService.getUserProfile(email);
        return UserMapper.fromAppModelToDTO(user);
    }

    @Patch(USER_ENDPOINT.PROFILE)
    @UseGuards(JwtGuard)
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDTO, description: 'User profile updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async updateUserProfile(
        @CurrentUser('email') email: string,
        @Body() dto: UpdateProfileDto,
    ): Promise<UserDTO> {
        console.log(email);
        const user = await this._userApplicationService.updateUserProfile(email, dto);
        return UserMapper.fromAppModelToDTO(user);
    }
}

function encodeSearchAfter(sort: (string | number)[]): string {
    return Buffer.from(JSON.stringify(sort), 'utf8').toString('base64url');
}

function decodeSearchAfter(cursor?: string): (string | number)[] | undefined {
    if (!cursor) return undefined;
    try {
        const json = Buffer.from(cursor, 'base64url').toString('utf8');
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : undefined;
    } catch {
        return undefined;
    }
}

