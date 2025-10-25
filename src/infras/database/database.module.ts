import {
    DATABASE_CONFIG,
    IDatabaseConfig,
} from '@common/configs/interfaces/database-config.interface';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import * as models from './models';
import { BaseAssetRepository, BaseUserRepository } from './repos';
import { SnakeNamingStrategy } from './snake-naming.strategy';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const dbConfig =
                    configService.get<IDatabaseConfig>(DATABASE_CONFIG);

                return {
                    type: 'postgres',
                    host: dbConfig.host,
                    port: dbConfig.port,
                    username: dbConfig.username,
                    password: dbConfig.password,
                    database: dbConfig.database,
                    entities: models,
                    synchronize: dbConfig.synchronize,
                    namingStrategy: new SnakeNamingStrategy(),
                    logging:
                        process.env.NODE_ENV === 'development'
                            ? ['query', 'error']
                            : ['error'],
                    autoLoadEntities: true,
                    ssl:
                        process.env.NODE_ENV === 'production'
                            ? { rejectUnauthorized: false }
                            : false,
                    extra: {
                        max: 10, // Maximum number of clients in the pool
                        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
                    },
                };
            },
            async dataSourceFactory(options) {
                if (!options) {
                    throw new Error('Invalid TypeORM options');
                }

                // Create the data source
                const dataSource = new DataSource(options);

                // Add transactional support
                return addTransactionalDataSource(dataSource);
            },
        }),
        TypeOrmModule.forFeature(Object.values(models)),
    ],
    providers: [
        // Repositories
        BaseUserRepository,
        BaseAssetRepository,
    ],
    exports: [
        TypeOrmModule,
        // Repositories
        BaseUserRepository,
        BaseAssetRepository,
    ],
})
export class DatabaseModule {
    /**
     * Register the module as a dynamic module with custom configuration
     */
    public static forRoot(): DynamicModule {
        return {
            module: DatabaseModule,
            global: true,
        };
    }
}
