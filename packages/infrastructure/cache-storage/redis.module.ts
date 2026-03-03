import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Cluster, ClusterNode, Redis } from 'ioredis';

import {
  BaseRedisConfig,
  IRedisRegisterOptions,
} from './const';
import { RedisBaseService } from './redis-base.service';

@Global()
@Module({})
export class RedisModule {
  public static registerAsync(registerOptions: IRedisRegisterOptions[]): DynamicModule {

    const providers = registerOptions.map((registerOption) => ({
      inject: [ConfigService],
      provide: registerOption.serviceToken,
      useFactory: (configService: ConfigService) => { 
        const { configKey } = registerOption;
        // we can validate config here if needed
        const config = configService.get<BaseRedisConfig>(configKey);
                
        return config.hostCluster?.length > 0
          ? RedisModule.getRedisClusterInstance(config)
          : RedisModule.getRedisInstance(config);
      },
    }));

    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: providers,
      exports: providers.map((provider) => provider.provide),
    };
  }

  public static getRedisInstance(redisConfig: BaseRedisConfig) {
    const { host, port, username, password, tls, prefix } = redisConfig || {};

    const redisClient =  new Redis({
      host,
      port,
      username,
      password,
      tls: tls ? { host, port } : undefined,
      keyPrefix: prefix,
      // we can move these to config if needed
      connectTimeout: 10000,
      retryStrategy: () => 10000,
      enableOfflineQueue: true,
    });

    return new RedisBaseService(redisClient);
  }

  public static getRedisClusterInstance(redisConfig: BaseRedisConfig) {
    const {
      hostCluster = [],
      port,
      username,
      password,
      prefix,
      tls,
    } = redisConfig || {};

    const startupNodes: ClusterNode[] = hostCluster.map((hostPort) => {
      const [host, customPort] = hostPort.split(':');

      return {
        host,
        port: +(customPort || port),
      };
    });

    const clusterClient = new Cluster(startupNodes, {
      keyPrefix: prefix,
      clusterRetryStrategy: () => 10000,
      enableOfflineQueue: true,
      redisOptions: {
        username,
        password,
        connectTimeout: 10000,
        tls: tls
          ? {
              checkServerIdentity: () => undefined,
            }
          : undefined,
      },
    });

    return new RedisBaseService(clusterClient);
  }
}
