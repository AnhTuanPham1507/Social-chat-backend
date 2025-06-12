import { getAppConfig } from "./app.config";
import { getDatabaseConfig } from "./database.config";
import { getGoogleAuthConfig } from "./google.config";
import { APP_CONFIG } from "./interfaces/app-config.interface";
import { DATABASE_CONFIG } from "./interfaces/database-config.interface";
import { GOOGLE_AUTH_CONFIG } from "./interfaces/google-config.interface";
import { JWT_CONFIG } from "./interfaces/jwt-config.interface";
import { MINIO_CONFIG } from "./interfaces/minio-config.interface";
import { getJwtConfig } from "./jwt.config";
import { getMinioConfig } from "./minio.config";

export const configs = () => ({
    [APP_CONFIG]: getAppConfig(),
    [DATABASE_CONFIG]: getDatabaseConfig(),
    [GOOGLE_AUTH_CONFIG]: getGoogleAuthConfig(),
    [JWT_CONFIG]: getJwtConfig(),
    [MINIO_CONFIG]: getMinioConfig()
})