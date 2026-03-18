import { PostEntity } from '@social-chat/domain';

export const POST_REPO_TOKEN = Symbol('POST_REPO_TOKEN');

export interface IPostRepository {
    insert(post: PostEntity): Promise<void>;
    update(post: PostEntity): Promise<void>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<PostEntity | null>;
    findByAuthorId(authorId: string, page: number, limit: number): Promise<PostEntity[]>;
    findFeed(page: number, limit: number): Promise<PostEntity[]>;
}
