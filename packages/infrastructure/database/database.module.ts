import { IDatabaseConfig } from '@social-chat/common';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import * as models from './models';
import { BaseAssetRepository, BasePostRepository, BaseUserRepository } from './repos';
import { SnakeNamingStrategy } from './snake-naming.strategy';

export interface DatabaseModuleAsyncOptions {
    /**
     * Factory function to provide database configuration
     */
    useFactory: (...args: any[]) => Promise<IDatabaseConfig> | IDatabaseConfig;
    /**
     * Optional dependencies to inject into the factory function
     */
    inject?: any[];
}

@Global()
@Module({})
export class DatabaseModule {
    /**
     * Register the module as a dynamic module with async configuration
     * @param options Async configuration options for the database module
     */
    public static forRootAsync(
        options: DatabaseModuleAsyncOptions,
    ): DynamicModule {
        return {
            module: DatabaseModule,
            global: true,
            imports: [
                TypeOrmModule.forRootAsync({
                    inject: options.inject || [],
                    useFactory: async (...args: any[]) => {
                        const dbConfig = await options.useFactory(...args);

                        if (!dbConfig) {
                            throw new Error(
                                'Database configuration not provided',
                            );
                        }

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
                            // just for development
                            logging: ['query', 'error'],
                            autoLoadEntities: true,
                            ssl: false,
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
                BasePostRepository,
            ],
            exports: [
                TypeOrmModule,
                // Repositories
                BaseUserRepository,
                BaseAssetRepository,
                BasePostRepository,
            ],
        };
    }
}
