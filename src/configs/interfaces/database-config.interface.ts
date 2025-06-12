export const DATABASE_CONFIG = 'DATABASE_CONFIG';

export interface IDatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
}