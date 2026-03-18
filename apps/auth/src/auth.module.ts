import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import {
  AUTH_APPLICATION_SERVICE_TOKEN,
  AuthApplicationService,
} from './application/application-services/auth.application-service';
import { USER_REPO_TOKEN } from './application/contracts/user-repository.contract';
import { UserRepo } from './driven-adapters/repos/user-repository.adapter';
import { IAMServiceAdapter } from './driven-adapters/services/iam-service.adapter';
import { AuthController } from './driving-adapters/controllers/auth.controller';
import { IAM_SERVICE_TOKEN } from '@application/contracts/iam-service.contract';
import { ConfigService } from '@nestjs/config';
import { SOCIAL_CHAT_KEYCLOAK_CONFIG } from '@social-chat/common';
import { EVENT_PUBLISHER } from '@social-chat/domain';
import { LibAuthModule } from '@social-chat/shared-libs';
import { AuthEventPublisherAdapter } from './driven-adapters/event-publisher/auth-event-publisher.adapter';

@Module({
  imports: [
    PassportModule,
    LibAuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const keycloakConfig = configService.get(SOCIAL_CHAT_KEYCLOAK_CONFIG);
        return { config: keycloakConfig };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_APPLICATION_SERVICE_TOKEN,
      useClass: AuthApplicationService,
    },
    {
      provide: USER_REPO_TOKEN,
      useClass: UserRepo,
    },
    {
      provide: IAM_SERVICE_TOKEN,
      useClass: IAMServiceAdapter,
    },
    {
      provide: EVENT_PUBLISHER,
      useClass: AuthEventPublisherAdapter,
    },
  ],
  exports: [AUTH_APPLICATION_SERVICE_TOKEN, IAM_SERVICE_TOKEN],
})
export class AuthModule {}
