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
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiBearerAuth,
    ApiBadRequestResponse,
    ApiNoContentResponse,
} from '@nestjs/swagger';
import FEED_ENDPOINT from '../../constants/endpoint.constant';
import { ICommentApplicationService, COMMENT_APPLICATION_SERVICE_TOKEN } from '@application/services/comment.application-service';
import { ICommentQueryApplicationService, COMMENT_QUERY_APPLICATION_SERVICE_TOKEN } from '@application/services/comment-query.application-service';
import { CommentDTO, CommentReadResponseDTO, PaginatedCommentsDTO } from '@driving-adapters/dtos/comment.dto';
import { CreateCommentDto } from '@driving-adapters/dtos/create-comment.dto';
import { EditCommentDto } from '@driving-adapters/dtos/edit-comment.dto';
import { CommentQueryDto } from '@driving-adapters/dtos/comment-query.dto';
import { CommentMapper } from '@driving-adapters/mappers/comment.mapper';
import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

@Controller(FEED_ENDPOINT.BASE)
@ApiTags('Comments')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class CommentController {
    constructor(
        @Inject(COMMENT_APPLICATION_SERVICE_TOKEN)
        private readonly _commentService: ICommentApplicationService,
        @Inject(COMMENT_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _commentQueryService: ICommentQueryApplicationService,
    ) {}

    @Get(FEED_ENDPOINT.COMMENTS)
    @ApiOkResponse({ type: PaginatedCommentsDTO, description: 'Comments retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getComments(
        @CurrentUser('id') userId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
        @Query() query: CommentQueryDto,
    ): Promise<PaginatedCommentsDTO> {
        const result = await this._commentQueryService.getCommentsByPostId(
            userId,
            postId,
            query.limit,
            query.cursor,
        );
        return {
            items: result.items.map(CommentMapper.fromReadDTOToResponse),
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }

    @Get(FEED_ENDPOINT.COMMENT_REPLIES)
    @ApiOkResponse({ type: PaginatedCommentsDTO, description: 'Replies retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getReplies(
        @CurrentUser('id') userId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Query() query: CommentQueryDto,
    ): Promise<PaginatedCommentsDTO> {
        const result = await this._commentQueryService.getReplies(
            userId,
            commentId,
            query.limit,
            query.cursor,
        );
        return {
            items: result.items.map(CommentMapper.fromReadDTOToResponse),
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }

    @Post(FEED_ENDPOINT.COMMENTS)
    @ApiCreatedResponse({ type: CommentDTO, description: 'Comment created successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Post or parent comment not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async createComment(
        @CurrentUser('id') userId: string,
        @Param('postId', ParseUUIDPipe) postId: string,
        @Body() dto: CreateCommentDto,
    ): Promise<CommentDTO> {
        const comment = await this._commentService.createComment(userId, postId, {
            content: dto.content,
            parentCommentId: dto.parentCommentId,
            attachments: dto.attachments,
        });
        return CommentMapper.fromAppModelToDTO(comment);
    }

    @Patch(FEED_ENDPOINT.COMMENT_BY_ID)
    @ApiOkResponse({ type: CommentDTO, description: 'Comment edited successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Comment not found' })
    @ApiForbiddenResponse({ description: 'Not the comment author' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async editComment(
        @CurrentUser('id') userId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Body() dto: EditCommentDto,
    ): Promise<CommentDTO> {
        const comment = await this._commentService.editComment(userId, commentId, dto);
        return CommentMapper.fromAppModelToDTO(comment);
    }

    @Delete(FEED_ENDPOINT.COMMENT_BY_ID)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Comment deleted successfully' })
    @ApiNotFoundResponse({ description: 'Comment not found' })
    @ApiForbiddenResponse({ description: 'Not the comment author' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async deleteComment(
        @CurrentUser('id') userId: string,
        @Param('commentId', ParseUUIDPipe) commentId: string,
    ): Promise<void> {
        await this._commentService.deleteComment(userId, commentId);
    }
}
