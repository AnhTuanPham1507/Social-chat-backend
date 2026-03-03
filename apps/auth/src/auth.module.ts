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
import { EventPublisherModule } from '@social-chat/infrastructure';
import { IAM_SERVICE_TOKEN } from '@application/contracts/iam-service.contract';
import { ConfigService } from '@nestjs/config';
import { SOCIAL_CHAT_KEYCLOAK_CONFIG } from '@social-chat/common';
import { LibAuthModule } from '@social-chat/shared-libs';

@Module({
  imports: [
    PassportModule,
    // Import EventPublisherModule to provide EVENT_PUBLISHER token
    EventPublisherModule,
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
    }
  ],
  exports: [AUTH_APPLICATION_SERVICE_TOKEN, IAM_SERVICE_TOKEN],
})
export class AuthModule {}
