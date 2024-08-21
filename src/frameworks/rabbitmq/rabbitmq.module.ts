import { Global, Module } from '@nestjs/common';
import { DIToken } from '../../core/enums/di-tokens.enum';
import { RabbitMQService } from './rabbitmq.service';

@Module({
    imports: [],
    providers: [
        {
            provide: DIToken.QUEUE_SERVICE,
            useClass: RabbitMQService,
        },
    ],
    exports: [DIToken.QUEUE_SERVICE],
})
@Global()
export class RabbitMQModule {}
