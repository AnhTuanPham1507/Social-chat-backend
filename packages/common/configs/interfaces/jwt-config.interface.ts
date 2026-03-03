export const JWT_CONFIG = 'JWT_CONFIG';

export interface IJwtConfig {
    secretKey: string;
    tokenExpire: string;
    refreshTokenExpire: string;
}
