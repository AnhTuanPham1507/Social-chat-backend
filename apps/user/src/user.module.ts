import { Module } from '@nestjs/common';

import { USER_APPLICATION_SERVICE_TOKEN, UserApplicationService } from './application/services/user.application-service';
import { UserController } from './driving-adapters/controllers/user.controller';
import { USER_REPO_TOKEN } from './application/contracts/user-repository.contract';
import { UserRepo } from './driven-adapters/repos/user-repository.adapter';

@Module({
    controllers: [UserController],
    providers: [
        {
            provide: USER_APPLICATION_SERVICE_TOKEN,
            useClass: UserApplicationService,
        },
        {
            provide: USER_REPO_TOKEN,
            useClass: UserRepo,
        },

    ],
})
export class UserModule {}

