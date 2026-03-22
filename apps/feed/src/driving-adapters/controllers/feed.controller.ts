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
import FEED_ENDPOINT from '../constants/endpoint.constant';
import { IFeedApplicationService, FEED_APPLICATION_SERVICE_TOKEN } from '@application/services/feed.application-service';
import { PostDTO } from '@driving-adapters/dtos/post.dto';
import { CreatePostDto } from '@driving-adapters/dtos/create-post.dto';
import { UpdatePostDto } from '@driving-adapters/dtos/update-post.dto';
import { PaginationQueryDto } from '@driving-adapters/dtos/pagination-query.dto';
import { PostMapper } from '@driving-adapters/mappers/post.mapper';
import { CurrentUser, JwtGuard } from '@social-chat/shared-libs';

@Controller(FEED_ENDPOINT.BASE)
@ApiTags('Feed')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class FeedController {
    constructor(
        @Inject(FEED_APPLICATION_SERVICE_TOKEN)
        private readonly _feedApplicationService: IFeedApplicationService,
    ) {}

    @Post(FEED_ENDPOINT.POSTS)
    @ApiCreatedResponse({ type: PostDTO, description: 'Post created successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async createPost(
        @CurrentUser('id') userId: string,
        @Body() dto: CreatePostDto,
    ): Promise<PostDTO> {
        const post = await this._feedApplicationService.createPost(userId, dto);
        return PostMapper.fromAppModelToDTO(post);
    }

    @Get(FEED_ENDPOINT.POSTS)
    @ApiOkResponse({ type: [PostDTO], description: 'Feed retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getFeed(
        @Query() query: PaginationQueryDto,
    ): Promise<PostDTO[]> {
        const posts = await this._feedApplicationService.getFeed(query.page, query.limit);
        return posts.map(PostMapper.fromAppModelToDTO);
    }

    @Get(FEED_ENDPOINT.MY_POSTS)
    @ApiOkResponse({ type: [PostDTO], description: 'User posts retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getMyPosts(
        @CurrentUser('id') userId: string,
        @Query() query: PaginationQueryDto,
    ): Promise<PostDTO[]> {
        const posts = await this._feedApplicationService.getPostsByAuthor(userId, query.page, query.limit);
        return posts.map(PostMapper.fromAppModelToDTO);
    }

    @Get(FEED_ENDPOINT.USER_POSTS)
    @ApiOkResponse({ type: [PostDTO], description: 'User posts retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getUserPosts(
        @Param('authorId', ParseUUIDPipe) authorId: string,
        @Query() query: PaginationQueryDto,
    ): Promise<PostDTO[]> {
        const posts = await this._feedApplicationService.getPostsByAuthor(authorId, query.page, query.limit);
        return posts.map(PostMapper.fromAppModelToDTO);
    }

    @Get(FEED_ENDPOINT.POST_BY_ID)
    @ApiOkResponse({ type: PostDTO, description: 'Post retrieved successfully' })
    @ApiNotFoundResponse({ description: 'Post not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' })
    public async getPostById(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<PostDTO> {
        const post = await this._feedApplicationService.getPostById(id);
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
        const post = await this._feedApplicationService.updatePost(userId, id, dto);
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
        await this._feedApplicationService.deletePost(userId, id);
    }
}
