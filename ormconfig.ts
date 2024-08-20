/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'tsconfig-paths/register';

import * as dotenv from 'dotenv';

import { SnakeNamingStrategy } from './src/frameworks/postgres/snake-naming.strategy';

import { DataSource } from 'typeorm';

if (!(<any>module).hot /* for webpack HMR */) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
}

const migrations = ['postgres/migrations/*{.ts,.js}'];

dotenv.config({
    path: `.${process.env.NODE_ENV}.env`,
});

// Replace \\n with \n to support multiline strings in AWS
for (const envName of Object.keys(process.env)) {
    process.env[envName] = process.env[envName].replace(/\\n/g, '\n');
}

module.exports = new DataSource({
    migrations,
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    namingStrategy: new SnakeNamingStrategy(),
    entities: ['src/frameworks/data-services/**/models/*.model{.ts,.js}'],
});
