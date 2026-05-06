import 'reflect-metadata';
import { CommandFactory } from 'nest-commander';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { CliModule } from './cli.module';

async function bootstrap(): Promise<void> {
    initializeTransactionalContext();

    try {
        await CommandFactory.run(CliModule, {
            logger: ['error', 'warn', 'log'],
        });
        process.exit(0);
    } catch (err) {
        console.error('CLI error:', err);
        process.exit(1);
    }
}

bootstrap();
