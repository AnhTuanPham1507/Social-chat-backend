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
    ApiOkResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiBearerAuth,
    ApiBadRequestResponse,
    ApiNoContentResponse,
} from '@nestjs/swagger';
import FEED_ENDPOINT from '../../constants/endpoint.constant';
import { IPostApplicationService, POST_APPLICATION_SERVICE_TOKEN } from '@application/services/post.application-service';
import { IPostQueryApplicationService, POST_QUERY_APPLICATION_SERVICE_TOKEN } from '@application/services/post-query.application-service';
import {
    IPostSearchQueryApplicationService,
    POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN,
} from '@application/services/post-search-query.application-service';
import { PostDTO, PaginatedPostsDTO } from '@driving-adapters/dtos/post.dto';
import { CreatePostDto } from '@driving-adapters/dtos/create-post.dto';
import { UpdatePostDto } from '@driving-adapters/dtos/update-post.dto';
import { SharePostDto } from '@driving-adapters/dtos/share-post.dto';
import { PaginationQueryDto } from '@driving-adapters/dtos/pagination-query.dto';
import { FeedQueryDto } from '@driving-adapters/dtos/feed-query.dto';
import { PostSearchQueryDto } from '@driving-adapters/dtos/post-search-query.dto';
import { PostMapper } from '@driving-adapters/mappers/post.mapper';
import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

@Controller(FEED_ENDPOINT.BASE)
@ApiTags('Posts')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class PostController {
    constructor(
        @Inject(POST_APPLICATION_SERVICE_TOKEN)
        private readonly _postCommandService: IPostApplicationService,
        @Inject(POST_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _postQueryService: IPostQueryApplicationService,
        @Inject(POST_SEARCH_QUERY_APPLICATION_SERVICE_TOKEN)
        private readonly _postSearchService: IPostSearchQueryApplicationService,
    ) {}

    @Post(FEED_ENDPOINT.POSTS)
    @ApiCreatedResponse({ type: PostDTO, description: 'Post created successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async createPost(
        @CurrentUser('id') userId: string,
        @Body() dto: CreatePostDto,
    ): Promise<PostDTO> {
        const post = await this._postCommandService.createPost(userId, dto);
        return PostMapper.fromAppModelToDTO(post);
    }

    @Get(FEED_ENDPOINT.POSTS)
    @ApiOkResponse({ type: PaginatedPostsDTO, description: 'Feed retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getFeed(
        @CurrentUser('id') userId: string,
        @Query() query: FeedQueryDto,
    ): Promise<PaginatedPostsDTO> {
        const result = await this._postQueryService.getFeed(userId, query.limit, query.cursor);
        return {
            items: result.items.map(PostMapper.fromAppModelToDTO),
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        };
    }

    @Get(FEED_ENDPOINT.SEARCH_POSTS)
    @ApiOkResponse({ description: 'Search results returned successfully' })
    @ApiBadRequestResponse({ description: 'Invalid search query' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async searchPosts(
        @Query() query: PostSearchQueryDto,
    ) {
        return this._postSearchService.searchPosts(
            query.q,
            {
                visibility: query.visibility,
                authorId: query.authorId,
                dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
                dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
            },
            query.size,
        );
    }

    @Get(FEED_ENDPOINT.MY_POSTS)
    @ApiOkResponse({ type: [PostDTO], description: 'User posts retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getMyPosts(
        @CurrentUser('id') userId: string,
        @Query() query: PaginationQueryDto,
    ): Promise<PostDTO[]> {
        const posts = await this._postQueryService.getPostsByAuthor(userId, userId, query.page, query.limit);
        return posts.map(PostMapper.fromAppModelToDTO);
    }

    @Get(FEED_ENDPOINT.USER_POSTS)
    @ApiOkResponse({ type: [PostDTO], description: 'User posts retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getUserPosts(
        @CurrentUser('id') userId: string,
        @Param('authorId', ParseUUIDPipe) authorId: string,
        @Query() query: PaginationQueryDto,
    ): Promise<PostDTO[]> {
        const posts = await this._postQueryService.getPostsByAuthor(userId, authorId, query.page, query.limit);
        return posts.map(PostMapper.fromAppModelToDTO);
    }

    @Post(FEED_ENDPOINT.SHARE_POST)
    @ApiCreatedResponse({ type: PostDTO, description: 'Post shared successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input or original post is deleted' })
    @ApiForbiddenResponse({ description: 'Cannot share a private post' })
    @ApiNotFoundResponse({ description: 'Original post not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async sharePost(
        @CurrentUser('id') userId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SharePostDto,
    ): Promise<PostDTO> {
        const post = await this._postCommandService.sharePost(userId, id, dto);
        return PostMapper.fromAppModelToDTO(post);
    }

    @Patch(FEED_ENDPOINT.POST_BY_ID)
    @ApiOkResponse({ type: PostDTO, description: 'Post updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Post not found' })
    @ApiForbiddenResponse({ description: 'Not allowed to update this post' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async updatePost(
        @CurrentUser('id') userId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePostDto,
    ): Promise<PostDTO> {
        const post = await this._postCommandService.updatePost(userId, id, dto);
        return PostMapper.fromAppModelToDTO(post);
    }

    @Delete(FEED_ENDPOINT.POST_BY_ID)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Post deleted successfully' })
    @ApiNotFoundResponse({ description: 'Post not found' })
    @ApiForbiddenResponse({ description: 'Not allowed to delete this post' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async deletePost(
        @CurrentUser('id') userId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        await this._postCommandService.deletePost(userId, id);
    }
}
