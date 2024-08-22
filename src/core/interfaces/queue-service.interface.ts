import { EventActions } from '../enums/event-action.enum';

export interface IQueueService {
    sendMessage(queueName: string, message: object, action: EventActions): void;
}
