import { getAppConfig } from './app.config';
import { getCoconutConfig } from './coconut.config';
import { getDatabaseConfig } from './database.config';
import { getElasticsearchConfig } from './elasticsearch.config';
import { getKafkaConfig } from './kafka.config';
import { getMongoConfig } from './mongo.config';
import { APP_CONFIG } from './interfaces/app-config.interface';
import { COCONUT_CONFIG } from './interfaces/coconut-config.interface';
import { DATABASE_CONFIG } from './interfaces/database-config.interface';
import { ELASTICSEARCH_CONFIG } from './interfaces/elasticsearch-config.interface';
import { JWT_CONFIG } from './interfaces/jwt-config.interface';
import { KAFKA_CONFIG } from './interfaces/kafka-config.interface';
import { SOCIAL_CHAT_KEYCLOAK_CONFIG } from './interfaces/keycloak-config.interface';
import { MONGO_CONFIG } from './interfaces/mongo-config.interface';
import { R2_CONFIG } from './interfaces/r2-config.interface';
import { REDIS_CONFIG, SHARED_STORE_CONFIG } from './interfaces/redis-config.interface';
import { getJwtConfig } from './jwt.config';
import {  getSocialChatKeycloakConfig } from './keycloak.config';
import { getR2Config } from './r2.config';
import { getCacheConfig, getSharedStoreConfig } from './redis.config';

export const configs = () => ({
    [APP_CONFIG]: getAppConfig(),
    [COCONUT_CONFIG]: getCoconutConfig(),
    [DATABASE_CONFIG]: getDatabaseConfig(),
    [ELASTICSEARCH_CONFIG]: getElasticsearchConfig(),
    [JWT_CONFIG]: getJwtConfig(),
    [KAFKA_CONFIG]: getKafkaConfig(),
    [MONGO_CONFIG]: getMongoConfig(),
    [R2_CONFIG]: getR2Config(),
    [SOCIAL_CHAT_KEYCLOAK_CONFIG]: getSocialChatKeycloakConfig(),
    [REDIS_CONFIG]: getCacheConfig(),
    [SHARED_STORE_CONFIG]: getSharedStoreConfig(),
});
