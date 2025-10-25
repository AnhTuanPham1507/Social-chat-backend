import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { API_CLIENTS } from './api-clients';
import { HttpService, HttpServiceOptions } from './http.service';

@Module({})
export class ExternalServiceModule {
    /**
     * Register the module with default configuration
     */
    public static register(): DynamicModule {
        return {
            module: ExternalServiceModule,
            imports: [ConfigModule],
            providers: [
                {
                    provide: HttpService,
                    useFactory: () => new HttpService(),
                },
                ...API_CLIENTS,
            ],
            exports: [HttpService, ...API_CLIENTS],
        };
    }

    /**
     * Register the module with custom configuration
     */
    public static registerAsync(options: {
        useFactory: (...args: any[]) => HttpServiceOptions;
        inject?: any[];
        imports?: any[];
    }): DynamicModule {
        return {
            module: ExternalServiceModule,
            imports: [...(options.imports || []), ConfigModule],
            providers: [
                {
                    provide: HttpService,
                    useFactory: (...args: any[]) => {
                        const config = options.useFactory(...args);
                        return new HttpService(config);
                    },
                    inject: options.inject || [],
                },
                ...API_CLIENTS,
            ],
            exports: [HttpService, ...API_CLIENTS],
        };
    }
}
