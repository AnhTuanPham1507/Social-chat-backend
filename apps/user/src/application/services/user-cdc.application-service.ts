import { Inject, Injectable, Logger } from '@nestjs/common';

import { DebeziumMessage } from '@social-chat/infrastructure';

import {
    IUserReadRepository,
    USER_READ_REPO_TOKEN,
} from '../contracts/user-read-repository.contract';

interface CdcUserRow {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

export const USER_CDC_APPLICATION_SERVICE_TOKEN = Symbol(
    'USER_CDC_APPLICATION_SERVICE_TOKEN',
);

export interface IUserCdcApplicationService {
    handleUserChange(message: DebeziumMessage): Promise<void>;
}

@Injectable()
export class UserCdcApplicationService implements IUserCdcApplicationService {
    private readonly _logger = new Logger(UserCdcApplicationService.name);

    constructor(
        @Inject(USER_READ_REPO_TOKEN)
        private readonly _userReadRepo: IUserReadRepository,
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
                break;
            }
            case 'd': {
                const row = before;
                await this._userReadRepo.deleteUser(row.id);
                this._logger.log(`feed_users projection removed for user ${row.id}`);
                break;
            }
        }
    }
}
