import { ICacheConfig, ISharedStoreConfig } from "./interfaces/redis-config.interface";

export const getCacheConfig = (): ICacheConfig => ({
    host: process.env.REDIS_CACHE_HOST,
    port: parseInt(process.env.REDIS_CACHE_PORT) || 6379,
    username: process.env.REDIS_CACHE_USERNAME,
    password: process.env.REDIS_CACHE_PASSWORD,
    tls: process.env.REDIS_CACHE_TLS === 'true',
    prefix: `${process.env.NODE_ENV}:${process.env.REDIS_CACHE_PREFIX}`,
});

export const getSharedStoreConfig = (): ISharedStoreConfig => ({
    hostCluster: (process.env.REDIS_SHARED_STORE_HOST_CLUSTER || '')
        .split(',')
        .filter((val) => val),
    host: process.env.REDIS_SHARED_STORE_HOST,
    port: parseInt(process.env.REDIS_SHARED_STORE_PORT) || 6379,
    username: process.env.REDIS_SHARED_STORE_USERNAME,
    password: process.env.REDIS_SHARED_STORE_PASSWORD,
    tls: process.env.REDIS_SHARED_STORE_TLS === 'true',
    prefix: `${process.env.NODE_ENV}:${process.env.REDIS_SHARED_STORE_PREFIX}`,
});