import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import FRIENDSHIP_ENDPOINT from '../../constants/friendship-endpoint.constant';
import { FRIENDSHIP_APPLICATION_SERVICE_TOKEN, IFriendshipApplicationService } from '@application/services/friendship.application-service';
import { SendFriendRequestDto } from '../dtos/send-friend-request.dto';
import { RespondFriendRequestDto } from '../dtos/respond-friend-request.dto';
import { FriendRequestResponseDto } from '../dtos/friend-request-response.dto';
import { FriendshipStatusResponseDto } from '../dtos/friendship-status-response.dto';
import { PendingRequestItemResponseDto } from '../dtos/pending-request-item-response.dto';
import { GetFriendsQueryDto } from '../dtos/get-friends-query.dto';
import { PaginatedFriendsResponseDto } from '../dtos/friend-item-response.dto';
import { FriendSuggestionItemResponseDto } from '../dtos/friend-suggestion-response.dto';
import { FriendRequestMapper } from '../mappers/friend-request.mapper';
import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

@Controller(FRIENDSHIP_ENDPOINT.BASE)
@ApiTags('Friends')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class FriendshipController {
    constructor(
        @Inject(FRIENDSHIP_APPLICATION_SERVICE_TOKEN)
        private readonly _friendshipService: IFriendshipApplicationService,
    ) {}

    // ── Friend Request ──────────────────────────────────────

    @Post(FRIENDSHIP_ENDPOINT.REQUEST)
    @ApiCreatedResponse({ type: FriendRequestResponseDto, description: 'Friend request sent successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input or cannot send request to yourself' })
    @ApiConflictResponse({ description: 'A pending friend request already exists' })
    @ApiNotFoundResponse({ description: 'Target user not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async sendFriendRequest(
        @CurrentUser('id') senderId: string,
        @Body() dto: SendFriendRequestDto,
    ): Promise<FriendRequestResponseDto> {
        const result = await this._friendshipService.sendFriendRequest({
            senderId,
            receiverId: dto.targetUserId,
        });
        return FriendRequestMapper.fromAppModelToDTO(result);
    }

    @Get(FRIENDSHIP_ENDPOINT.REQUEST_PENDING)
    @ApiOkResponse({ type: [PendingRequestItemResponseDto], description: 'List of pending friend requests' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async getPendingRequests(
        @CurrentUser('id') currentUserId: string,
    ): Promise<PendingRequestItemResponseDto[]> {
        return this._friendshipService.getPendingRequests(currentUserId);
    }

    @Put(FRIENDSHIP_ENDPOINT.REQUEST_BY_ID)
    @ApiOkResponse({ type: FriendRequestResponseDto, description: 'Friend request updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input' })
    @ApiNotFoundResponse({ description: 'Friend request not found' })
    @ApiForbiddenResponse({ description: 'Only the request recipient can respond' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async respondToFriendRequest(
        @CurrentUser('id') currentUserId: string,
        @Param('id', ParseUUIDPipe) requestId: string,
        @Body() dto: RespondFriendRequestDto,
    ): Promise<FriendRequestResponseDto> {
        const result = await this._friendshipService.respondToFriendRequest({
            requestId,
            currentUserId,
            action: dto.action,
        });
        return FriendRequestMapper.fromAppModelToDTO(result);
    }

    @Delete(FRIENDSHIP_ENDPOINT.REQUEST_BY_ID)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Friend request cancelled successfully' })
    @ApiNotFoundResponse({ description: 'Friend request not found' })
    @ApiForbiddenResponse({ description: 'Only the sender can cancel a friend request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async cancelFriendRequest(
        @CurrentUser('id') currentUserId: string,
        @Param('id', ParseUUIDPipe) requestId: string,
    ): Promise<void> {
        await this._friendshipService.cancelFriendRequest({
            requestId,
            currentUserId,
        });
    }

    // ── Suggestions ─────────────────────────────────────────

    @Get(FRIENDSHIP_ENDPOINT.SUGGESTIONS)
    @ApiOkResponse({ type: [FriendSuggestionItemResponseDto], description: 'List of friend suggestions' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async getSuggestions(
        @CurrentUser('id') currentUserId: string,
    ): Promise<FriendSuggestionItemResponseDto[]> {
        return this._friendshipService.getSuggestions(currentUserId);
    }

    // ── Friendship ──────────────────────────────────────────

    @Get(FRIENDSHIP_ENDPOINT.STATUS)
    @ApiOkResponse({ type: FriendshipStatusResponseDto, description: 'Friendship status retrieved' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async getFriendshipStatus(
        @CurrentUser('id') currentUserId: string,
        @Param('userId', ParseUUIDPipe) targetUserId: string,
    ): Promise<FriendshipStatusResponseDto> {
        return this._friendshipService.getFriendshipStatus(currentUserId, targetUserId);
    }

    @Get()
    @ApiOkResponse({ type: PaginatedFriendsResponseDto, description: 'Paginated list of friends' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async getFriends(
        @CurrentUser('id') currentUserId: string,
        @Query() query: GetFriendsQueryDto,
    ): Promise<PaginatedFriendsResponseDto> {
        return this._friendshipService.getFriends({
            currentUserId,
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
        });
    }

    @Delete(FRIENDSHIP_ENDPOINT.BY_USER_ID)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Friendship removed successfully' })
    @ApiNotFoundResponse({ description: 'Friendship not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async unfriend(
        @CurrentUser('id') currentUserId: string,
        @Param('userId', ParseUUIDPipe) targetUserId: string,
    ): Promise<void> {
        await this._friendshipService.unfriend({
            currentUserId,
            targetUserId,
        });
    }

    @Post(FRIENDSHIP_ENDPOINT.BLOCK)
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'User blocked successfully' })
    @ApiBadRequestResponse({ description: 'Cannot block yourself' })
    @ApiConflictResponse({ description: 'User is already blocked' })
    @ApiNotFoundResponse({ description: 'Target user not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async blockUser(
        @CurrentUser('id') blockerId: string,
        @Param('userId', ParseUUIDPipe) blockedId: string,
    ): Promise<void> {
        await this._friendshipService.blockUser({
            blockerId,
            blockedId,
        });
    }

    @Delete(FRIENDSHIP_ENDPOINT.UNBLOCK)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'User unblocked successfully' })
    @ApiNotFoundResponse({ description: 'Block relationship not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    async unblockUser(
        @CurrentUser('id') unblockerId: string,
        @Param('userId', ParseUUIDPipe) unblockedId: string,
    ): Promise<void> {
        await this._friendshipService.unblockUser({
            unblockerId,
            unblockedId,
        });
    }
}
