import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiClient } from '@social-chat/infrastructure';
import { IUserService, UserServiceResult } from '@application/contracts/user-service.contract';

@Injectable()
export class UserServiceAdapter extends BaseApiClient implements IUserService {
    constructor(configService: ConfigService) {
        const userServiceUrl = configService.get<string>('USER_SERVICE_URL');
        const internalApiKey = configService.get<string>('INTERNAL_API_KEY');

        super({
            baseURL: userServiceUrl,
            timeout: 5000,
            retryAttempts: 2,
            defaultHeaders: {
                'x-api-key': internalApiKey,
            },
        });
    }

    public async createUser(id: string, email: string, fullName: string): Promise<UserServiceResult> {
        const response = await this.post<UserServiceResult>('/internal/users', { id, email, fullName });
        return response.data;
    }
}
