import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
    ApiBearerAuth,
    ApiBadRequestResponse,
    ApiNoContentResponse,
    ApiQuery,
} from '@nestjs/swagger';
import FEED_ENDPOINT from '../../constants/endpoint.constant';
import { IReactionApplicationService, REACTION_APPLICATION_SERVICE_TOKEN } from '@application/services/reaction.application-service';
import { POST_QUERY_APPLICATION_SERVICE_TOKEN, IPostQueryApplicationService } from '@application/services/post-query.application-service';
import { ReactionDTO } from '@driving-adapters/dtos/reaction.dto';
import { ReactToPostDto } from '@driving-adapters/dtos/react-to-post.dto';
import { ReactionQueryDto } from '@driving-adapters/dtos/reaction-query.dto';
import { PaginatedReactionsDTO } from '@driving-adapters/dtos/reaction-read.dto';
import { ReactionMapper } from '@driving-adapters/mappers/reaction.mapper';
import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

@Controller(FEED_ENDPOINT.BASE)
@ApiTags('Reactions')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ReactionController {
    constructor(
        @Inject(REACTION_APPLICATION_SERVICE_TOKEN)
        private readonly _reactionApplicationService: IReactionApplicationService,
        @Inject(POST_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _postQueryService: IPostQueryApplicationService,
    ) {}

    @Post(FEED_ENDPOINT.POST_REACTIONS)
    @ApiCreatedResponse({ type: ReactionDTO, description: 'Reaction created or updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Post not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async reactToPost(
        @CurrentUser('id') userId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
        @Body() dto: ReactToPostDto,
    ): Promise<ReactionDTO> {
        const reaction = await this._reactionApplicationService.reactToPost(userId, postId, dto);
        return ReactionMapper.fromAppModelToDTO(reaction);
    }

    @Delete(FEED_ENDPOINT.POST_REACTIONS)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Reaction removed successfully' })
    @ApiNotFoundResponse({ description: 'Reaction not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async removeReaction(
        @CurrentUser('id') userId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
    ): Promise<void> {
        await this._reactionApplicationService.removeReaction(userId, postId);
    }

    @Get(FEED_ENDPOINT.POST_REACTIONS)
    @ApiOkResponse({ type: PaginatedReactionsDTO, description: 'Reactions retrieved successfully with author info' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getReactions(
        @Param('postId', ParseUUIDPipe) postId: string,
        @Query() query: ReactionQueryDto,
    ): Promise<PaginatedReactionsDTO> {
        const result = await this._postQueryService.getReactionsByPostId(
            postId,
            query.limit,
            query.cursor,
            query.type,
        );

        return {
            items: result.items.map((item) => ({
                id: item._id,
                contentId: item.contentId,
                contentType: item.contentType as any,
                reaction: item.reaction as any,
                author: item.author,
                createdAt: item.reactionCreatedAt,
            })),
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }

    @Post(FEED_ENDPOINT.COMMENT_REACTIONS)
    @ApiCreatedResponse({ type: ReactionDTO, description: 'Comment reaction created or updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Comment not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async reactToComment(
        @CurrentUser('id') userId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Body() dto: ReactToPostDto,
    ): Promise<ReactionDTO> {
        const reaction = await this._reactionApplicationService.reactToComment(userId, commentId, dto);
        return ReactionMapper.fromAppModelToDTO(reaction);
    }

    @Delete(FEED_ENDPOINT.COMMENT_REACTIONS)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Comment reaction removed successfully' })
    @ApiNotFoundResponse({ description: 'Reaction not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async removeCommentReaction(
        @CurrentUser('id') userId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
    ): Promise<void> {
        await this._reactionApplicationService.removeCommentReaction(userId, commentId);
    }
}
