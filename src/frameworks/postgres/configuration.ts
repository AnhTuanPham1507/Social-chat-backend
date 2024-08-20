/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';

export default function (): TypeOrmModuleOptions {
    let entities = [__dirname + '/models/*.model{.ts,.js}'];

    // Replace \\n with \n to support multiline strings in AWS
    for (const envName of Object.keys(process.env)) {
        process.env[envName] = process.env[envName].replace(/\\n/g, '\n');
    }

    if ((<any>module).hot) {
        const entityContext = (<any>require).context(
            './../../modules',
            true,
            /\.model\.ts$/,
        );
        entities = entityContext.keys().map((id) => {
            const entityModule = entityContext(id);
            const [entity] = Object.values(entityModule);
            return entity;
        });
    }

    return {
        entities,
        keepConnectionAlive: true,
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        migrationsRun: true,
        logging: process.env.PROD_TYPE === 'development',
        namingStrategy: new SnakeNamingStrategy(),
    };
}
