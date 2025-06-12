import { IAppConfig } from "./interfaces/app-config.interface";

export const getAppConfig = (): IAppConfig => ({
    port: Number.parseInt(process.env.APP_PORT || '3000'),
    env: process.env.APP_ENV || 'development'
})