import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import InitConfiguration from './configuration';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: InitConfiguration,
        }),
    ],
})
export class PostgresModule {}
