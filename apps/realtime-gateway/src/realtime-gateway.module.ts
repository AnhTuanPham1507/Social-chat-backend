import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SOCIAL_CHAT_KEYCLOAK_CONFIG } from '@social-chat/common';
import { LibAuthModule } from '@social-chat/shared-libs';

import { PRESENCE_REPO_TOKEN } from './application/contracts/presence-repository.contract';
import { USER_CONVERSATIONS_CACHE_TOKEN } from './application/contracts/user-conversations-cache.contract';
import { MessagingApiClient } from './driven-adapters/messaging-api.client';
import { PresenceRedisAdapter } from './driven-adapters/presence-redis.adapter';
import { RedisSubscriptionManager } from './driven-adapters/redis-subscription-manager';
import { RedisUserConversationsCache } from './driven-adapters/redis-user-conversations-cache.adapter';
import { RealtimeGateway } from './driving-adapters/gateways/realtime.gateway';

@Module({
    imports: [
        LibAuthModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const keycloakConfig = configService.get(SOCIAL_CHAT_KEYCLOAK_CONFIG);
                return { config: keycloakConfig };
            },
        }),
    ],
    providers: [
        RedisSubscriptionManager,
        MessagingApiClient,
        {
            provide: USER_CONVERSATIONS_CACHE_TOKEN,
            useClass: RedisUserConversationsCache,
        },
        {
            provide: PRESENCE_REPO_TOKEN,
            useClass: PresenceRedisAdapter,
        },
        RealtimeGateway,
    ],
    exports: [],
})
export class RealtimeGatewayModule {}
