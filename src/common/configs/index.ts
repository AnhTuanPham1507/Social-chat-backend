import { getAppConfig } from './app.config';
import { getDatabaseConfig } from './database.config';
import { APP_CONFIG } from './interfaces/app-config.interface';
import { DATABASE_CONFIG } from './interfaces/database-config.interface';
import { JWT_CONFIG } from './interfaces/jwt-config.interface';
import { KEYCLOAK_CONFIG } from './interfaces/keycloak-config.interface';
import { MINIO_CONFIG } from './interfaces/minio-config.interface';
import { getJwtConfig } from './jwt.config';
import { getKeycloakConfig } from './keycloak.config';
import { getMinioConfig } from './minio.config';

export const configs = () => ({
    [APP_CONFIG]: getAppConfig(),
    [DATABASE_CONFIG]: getDatabaseConfig(),
    [JWT_CONFIG]: getJwtConfig(),
    [MINIO_CONFIG]: getMinioConfig(),
    [KEYCLOAK_CONFIG]: getKeycloakConfig(),
});
