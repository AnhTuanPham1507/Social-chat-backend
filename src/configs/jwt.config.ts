import { IJwtConfig } from "./interfaces/jwt-config.interface";

export const getJwtConfig = (): IJwtConfig => ({
    secretKey: process.env.JWT_SECRET || 'JWT_SECRET',
    tokenExpire: process.env.JWT_TOKEN_EXPIRE || '15m',
    refreshTokenExpire: process.env.JWT_REFRESH_TOKEN_EXPIRE || '3d',
})