import { IDatabaseConfig } from "./interfaces/database-config.interface";

export const getDatabaseConfig = (): IDatabaseConfig => ({
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'social-chat-db',
    synchronize: Boolean(process.env.DB_SYNCHRONIZE === 'true'),
})