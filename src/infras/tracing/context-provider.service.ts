import { CONTEXT } from '@commons/constants/app.const';
import { Injectable } from '@nestjs/common/decorators';
import { ClsService } from 'nestjs-cls';

export interface ClsContext {
    requestId: string;
}

@Injectable()
export class ContextProviderService {
    constructor(private clsService: ClsService) {}

    public getContext(): ClsContext {
        return this.clsService.get(CONTEXT);
    }
}
