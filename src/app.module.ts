import { Module } from '@nestjs/common';
import { PostgresModule } from './frameworks/data-services/postgres/postgres.module';

@Module({
    imports: [PostgresModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
