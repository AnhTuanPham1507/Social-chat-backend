import { Injectable } from '@nestjs/common';
import { IClock } from '@social-chat/domain';

@Injectable()
export class SystemClock implements IClock {
    now(): Date {
        return new Date();
    }
}
