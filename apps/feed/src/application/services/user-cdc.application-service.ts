import { Inject, Injectable, Logger } from '@nestjs/common';
import { DebeziumMessage } from '@social-chat/infrastructure';
import {
    REACTION_READ_REPO_TOKEN,
    IReactionReadRepository,
} from '../contracts/reaction-read-repository.contract';
import {
    POST_READ_REPO_TOKEN,
    IPostReadRepository,
} from '../contracts/post-read-repository.contract';
import {
    USER_READ_REPO_TOKEN,
    IUserReadRepository,
} from '../contracts/user-read-repository.contract';
import {
    COMMENT_READ_REPO_TOKEN,
    ICommentReadRepository,
} from '../contracts/comment-read-repository.contract';

interface CdcUserRow {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    sex: string;
    avatar_url: string | null;
    interests: string[];
    has_completed_onboarding: boolean;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
}

export const USER_CDC_APPLICATION_SERVICE_TOKEN = Symbol('USER_CDC_APPLICATION_SERVICE_TOKEN');

export interface IUserCdcApplicationService {
    handleUserChange(message: DebeziumMessage): Promise<void>;
}

@Injectable()
export class UserCdcApplicationService implements IUserCdcApplicationService {
    private readonly _logger = new Logger(UserCdcApplicationService.name);

    constructor(
        @Inject(USER_READ_REPO_TOKEN)
        private readonly _userReadRepo: IUserReadRepository,
        @Inject(REACTION_READ_REPO_TOKEN)
        private readonly _reactionReadRepo: IReactionReadRepository,
        @Inject(POST_READ_REPO_TOKEN)
        private readonly _postReadRepo: IPostReadRepository,
        @Inject(COMMENT_READ_REPO_TOKEN)
        private readonly _commentReadRepo: ICommentReadRepository,
    ) {}

    async handleUserChange(message: DebeziumMessage): Promise<void> {
        const { op, before, after } = message as unknown as DebeziumMessage<CdcUserRow>;

        switch (op) {
            case 'c':
            case 'r':
            case 'u': {
                const row = after;

                await this._userReadRepo.upsertUser(row.id, {
                    displayName: row.full_name,
                    avatarUrl: row.avatar_url ?? undefined,
                });

                await this._reactionReadRepo.updateAuthorInfo(row.id, {
                    name: row.full_name,
                    avatar: row.avatar_url ?? undefined,
                });

                await this._commentReadRepo.updateAuthorInfo(row.id, {
                    name: row.full_name,
                    avatar: row.avatar_url ?? undefined,
                });

                await this._postReadRepo.updateAuthorInfo(row.id, {
                    name: row.full_name,
                    avatar: row.avatar_url ?? undefined,
                });
                break;
            }
            case 'd': {
                const row = before;
                await this._userReadRepo.deleteUser(row.id);
                await this._handleUserDeleted(row.id);
                break;
            }
        }
    }

    private async _handleUserDeleted(userId: string): Promise<void> {
        const reactionCounts = await this._reactionReadRepo.aggregateReactionCountsByUserId(userId);

        await Promise.all(
            reactionCounts.map((entry) =>
                this._postReadRepo.incrementReactionCount(
                    entry.contentId,
                    entry.reaction,
                    -entry.count,
                ),
            ),
        );

        await this._reactionReadRepo.deleteAllByUserId(userId);

        this._logger.log(
            `User ${userId} deleted: removed reactions from ${reactionCounts.length} post-reaction groups`,
        );
    }
}
