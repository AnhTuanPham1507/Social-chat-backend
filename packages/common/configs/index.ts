import { getAppConfig } from './app.config';
import { getDatabaseConfig } from './database.config';
import { APP_CONFIG } from './interfaces/app-config.interface';
import { DATABASE_CONFIG } from './interfaces/database-config.interface';
import { JWT_CONFIG } from './interfaces/jwt-config.interface';
import { SOCIAL_CHAT_KEYCLOAK_CONFIG } from './interfaces/keycloak-config.interface';
import { MINIO_CONFIG } from './interfaces/minio-config.interface';
import { REDIS_CONFIG, SHARED_STORE_CONFIG } from './interfaces/redis-config.interface';
import { getJwtConfig } from './jwt.config';
import {  getSocialChatKeycloakConfig } from './keycloak.config';
import { getMinioConfig } from './minio.config';
import { getCacheConfig, getSharedStoreConfig } from './redis.config';

export const configs = () => ({
    [APP_CONFIG]: getAppConfig(),
    [DATABASE_CONFIG]: getDatabaseConfig(),
    [JWT_CONFIG]: getJwtConfig(),
    [MINIO_CONFIG]: getMinioConfig(),
    [SOCIAL_CHAT_KEYCLOAK_CONFIG]: getSocialChatKeycloakConfig(),
    [REDIS_CONFIG]: getCacheConfig(),
    [SHARED_STORE_CONFIG]: getSharedStoreConfig(),
});
