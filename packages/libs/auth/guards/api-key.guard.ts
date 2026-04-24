import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const API_KEY_HEADER = 'x-api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly _configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers[API_KEY_HEADER];

        const expectedApiKey = this._configService.get<string>('INTERNAL_API_KEY');

        if (!apiKey || apiKey !== expectedApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }
}
