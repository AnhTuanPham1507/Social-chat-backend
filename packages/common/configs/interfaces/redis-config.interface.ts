export const REDIS_CONFIG = 'REDIS_CONFIG';
export interface ICacheConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    tls: boolean;
    prefix: string;
}

export const SHARED_STORE_CONFIG = 'SHARED_STORE_CONFIG';
export interface ISharedStoreConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    tls: boolean;
    prefix: string;
    hostCluster: string[];
}