import { EventActions } from '../enums/event-actioon.enum';

export interface IQueueService {
    sendMessage(queueName: string, message: object, action: EventActions): void;
}
