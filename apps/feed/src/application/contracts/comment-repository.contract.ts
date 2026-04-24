import { CommentEntity } from '@social-chat/domain';

export const COMMENT_REPO_TOKEN = Symbol('COMMENT_REPO_TOKEN');

export interface ICommentRepository {
    insert(comment: CommentEntity): Promise<void>;
    update(comment: CommentEntity): Promise<void>;
    softDelete(id: string): Promise<void>;
    softDeleteByPostId(postId: string): Promise<number>;
    findById(id: string): Promise<CommentEntity | null>;
    findAllByPostId(postId: string): Promise<CommentEntity[]>;
    findByPostId(postId: string, page: number, limit: number): Promise<CommentEntity[]>;
    countByPostId(postId: string): Promise<number>;
}
