import { Injectable } from '@nestjs/common';
import {
    ClientProxy,
    ClientProxyFactory,
    Transport,
} from '@nestjs/microservices';
import { QueueName } from '../../core/enums/queue-name';
import { IQueueService } from '../../core/interfaces/queue-service.interface';
import { EventActions } from '../../core/enums/event-actioon.enum';

@Injectable()
export class RabbitMQService implements IQueueService {
    private clients = new Map<string, ClientProxy>();

    constructor() {
        // Tạo các client proxy cho các queue khác nhau
        Object.values(QueueName).forEach((queue: QueueName) => {
            this.clients.set(queue, this.createClient(queue));
        });
    }
    private createClient(queue: QueueName): ClientProxy {
        return (
            this.getClient(queue) ||
            ClientProxyFactory.create({
                options: {
                    urls: [process.env.MQ_HOST],
                    queue: queue,
                    retryAttempts: 5,
                    retryDelay: 1000,
                    messageTtl: 60000,
                    heartbeat: 20,
                    connectTimeout: 10000,
                    exchangeOptions: {
                        name: 'default',
                        type: 'direct',
                        durable: true, // Exchange sẽ tồn tại sau khi RabbitMQ khởi động lại
                    },
                    queueOptions: {
                        durable: true, // Queue sẽ tồn tại sau khi RabbitMQ khởi động lại
                    },
                },
            })
        );
    }

    getClient(queue: QueueName): ClientProxy {
        return this.clients.get(queue);
    }

    sendMessage(queue: QueueName, message: any, action: EventActions) {
        const client = this.getClient(queue);
        if (client) {
            client.emit(queue, JSON.stringify({ message, action })).subscribe({
                next: (response) =>
                    console.log(`Sent message to ${queue}:`, response),
                error: (err) => console.error('Error:', err),
            });
        } else {
            console.error(`Client for queue ${queue} not found`);
        }
    }
}
