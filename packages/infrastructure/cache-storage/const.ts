export type BaseRedisConfig = {
    host: string;
    port: number;
    username: string;
    password: string;
    tls: boolean;
    prefix: string;
    hostCluster?: string[];
}

export interface IRedisRegisterOptions {
    serviceToken: string;
    configKey: string;
}

export enum REDIS_SERVICE_TOKEN {
    CACHE_SERVICE = 'CACHE_SERVICE',
    SHARED_STORE_SERVICE = 'SHARED_STORE_SERVICE',
}