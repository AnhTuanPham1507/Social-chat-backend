import { Injectable, Logger } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import {
    plainToClass,
    ClassConstructor,
    ClassTransformOptions,
} from 'class-transformer';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';

import { HttpService, HttpRequestConfig } from './http.service';
import {
    CircuitBreaker,
    CircuitBreakerOptions,
    RateLimiter,
    RateLimiterOptions,
} from './utils';

export interface ApiClientOptions {
    baseURL: string;
    defaultHeaders?: Record<string, string>;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    circuitBreaker?: CircuitBreakerOptions;
    rateLimiter?: RateLimiterOptions;
    enableCircuitBreaker?: boolean;
    enableRateLimiter?: boolean;
}

export interface TransformOptions {
    enableValidation?: boolean;
    validationOptions?: ValidatorOptions;
    transformOptions?: ClassTransformOptions;
}

export interface ApiResponse<T> {
    data: T;
    headers: Record<string, string>;
    status: number;
    statusText: string;
    config: any;
}

@Injectable()
export abstract class BaseApiClient {
    protected readonly logger: Logger;
    protected readonly httpService: HttpService;
    protected readonly baseURL: string;
    protected readonly defaultHeaders: Record<string, string>;
    protected readonly circuitBreaker?: CircuitBreaker;
    protected readonly rateLimiter?: RateLimiter;
    protected readonly enableCircuitBreaker: boolean;
    protected readonly enableRateLimiter: boolean;

    constructor(options: ApiClientOptions) {
        const {
            baseURL,
            defaultHeaders = {},
            timeout = 30000,
            retryAttempts = 3,
            retryDelay = 1000,
            circuitBreaker: circuitBreakerOptions,
            rateLimiter: rateLimiterOptions,
            enableCircuitBreaker = false,
            enableRateLimiter = false,
        } = options;

        this.baseURL = baseURL;
        this.defaultHeaders = defaultHeaders;
        this.logger = new Logger(this.constructor.name);
        this.enableCircuitBreaker = enableCircuitBreaker;
        this.enableRateLimiter = enableRateLimiter;

        this.httpService = new HttpService({
            baseURL,
            timeout,
            headers: defaultHeaders,
            defaultRetryAttempts: retryAttempts,
            defaultRetryDelay: retryDelay,
        });

        if (this.enableCircuitBreaker) {
            this.circuitBreaker = new CircuitBreaker(circuitBreakerOptions);
        }

        if (this.enableRateLimiter) {
            this.rateLimiter = new RateLimiter(rateLimiterOptions);
        }
    }

    /**
     * Execute a request with circuit breaker and rate limiter if enabled
     */
    private async executeRequest<T>(
        requestFn: () => Promise<AxiosResponse<T>>,
    ): Promise<AxiosResponse<T>> {
        // Apply circuit breaker if enabled
        if (this.enableCircuitBreaker && this.circuitBreaker) {
            return this.circuitBreaker.execute(async () => {
                // Apply rate limiter if enabled
                if (this.enableRateLimiter && this.rateLimiter) {
                    return this.rateLimiter.execute(requestFn);
                }
                return requestFn();
            });
        }

        // Apply rate limiter if enabled
        if (this.enableRateLimiter && this.rateLimiter) {
            return this.rateLimiter.execute(requestFn);
        }

        // Execute request directly
        return requestFn();
    }

    /**
     * Transform response data to DTO class instance with validation
     */
    private async transformResponse<T>(
        response: AxiosResponse,
        dtoClass: ClassConstructor<T>,
        options?: TransformOptions,
    ): Promise<ApiResponse<T>> {
        const {
            enableValidation = false,
            validationOptions = {},
            transformOptions = {},
        } = options || {};

        try {
            // Transform plain object to class instance
            const transformedData = plainToClass(dtoClass, response.data, {
                excludeExtraneousValues: true,
                enableImplicitConversion: true,
                ...transformOptions,
            });

            // Validate if enabled
            if (enableValidation) {
                const errors = await validate(
                    transformedData as object,
                    validationOptions,
                );
                if (errors.length > 0) {
                    const errorMessages = errors
                        .map((error: ValidationError) =>
                            Object.values(error.constraints || {}).join(', '),
                        )
                        .join('; ');

                    this.logger.error(
                        `Validation failed for ${dtoClass.name}: ${errorMessages}`,
                    );
                    throw new Error(
                        `Response validation failed: ${errorMessages}`,
                    );
                }
            }

            // Return enhanced response wrapper
            return {
                data: transformedData,
                headers: this.normalizeHeaders(response.headers),
                status: response.status,
                statusText: response.statusText,
                config: response.config,
            };
        } catch (error) {
            this.logger.error(
                `Failed to transform response to ${dtoClass.name}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Make a GET request with DTO transformation
     */
    protected async get<T>(
        url: string,
        dtoClass: ClassConstructor<T>,
        config?: HttpRequestConfig,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T>>;
    /**
     * Make a GET request (original method)
     */
    protected async get<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>>;
    /**
     * Implementation
     */
    protected async get<T = any>(
        url: string,
        dtoClassOrConfig?: ClassConstructor<T> | HttpRequestConfig,
        configOrTransformOptions?: HttpRequestConfig | TransformOptions,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T> | AxiosResponse<T>> {
        // Check if first parameter after url is a class constructor
        const isDtoTransformation = typeof dtoClassOrConfig === 'function';

        if (isDtoTransformation) {
            const dtoClass = dtoClassOrConfig as ClassConstructor<T>;
            const config = configOrTransformOptions as HttpRequestConfig;
            const response = await this.executeRequest<T>(() =>
                this.httpService.get<T>(url, this.mergeConfig(config)),
            );
            return this.transformResponse(response, dtoClass, transformOptions);
        } else {
            const config = dtoClassOrConfig as HttpRequestConfig;
            return this.executeRequest<T>(() =>
                this.httpService.get<T>(url, this.mergeConfig(config)),
            );
        }
    }

    /**
     * Make a POST request with DTO transformation
     */
    protected async post<T>(
        url: string,
        dtoClass: ClassConstructor<T>,
        data?: any,
        config?: HttpRequestConfig,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T>>;
    /**
     * Make a POST request (original method)
     */
    protected async post<T = any>(
        url: string,
        data?: any,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>>;
    /**
     * Implementation
     */
    protected async post<T = any>(
        url: string,
        dtoClassOrData?: ClassConstructor<T> | any,
        dataOrConfig?: any | HttpRequestConfig,
        configOrTransformOptions?: HttpRequestConfig | TransformOptions,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T> | AxiosResponse<T>> {
        // Check if first parameter after url is a class constructor
        const isDtoTransformation = typeof dtoClassOrData === 'function';

        if (isDtoTransformation) {
            const dtoClass = dtoClassOrData as ClassConstructor<T>;
            const data = dataOrConfig;
            const config = configOrTransformOptions as HttpRequestConfig;
            const response = await this.executeRequest<T>(() =>
                this.httpService.post<T>(url, data, this.mergeConfig(config)),
            );
            return this.transformResponse(response, dtoClass, transformOptions);
        } else {
            const data = dtoClassOrData;
            const config = dataOrConfig as HttpRequestConfig;
            return this.executeRequest<T>(() =>
                this.httpService.post<T>(url, data, this.mergeConfig(config)),
            );
        }
    }

    /**
     * Make a PUT request with DTO transformation
     */
    protected async put<T>(
        url: string,
        dtoClass: ClassConstructor<T>,
        data?: any,
        config?: HttpRequestConfig,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T>>;
    /**
     * Make a PUT request (original method)
     */
    protected async put<T = any>(
        url: string,
        data?: any,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>>;
    /**
     * Implementation
     */
    protected async put<T = any>(
        url: string,
        dtoClassOrData?: ClassConstructor<T> | any,
        dataOrConfig?: any | HttpRequestConfig,
        configOrTransformOptions?: HttpRequestConfig | TransformOptions,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T> | AxiosResponse<T>> {
        // Check if first parameter after url is a class constructor
        const isDtoTransformation = typeof dtoClassOrData === 'function';

        if (isDtoTransformation) {
            const dtoClass = dtoClassOrData as ClassConstructor<T>;
            const data = dataOrConfig;
            const config = configOrTransformOptions as HttpRequestConfig;
            const response = await this.executeRequest<T>(() =>
                this.httpService.put<T>(url, data, this.mergeConfig(config)),
            );
            return this.transformResponse(response, dtoClass, transformOptions);
        } else {
            const data = dtoClassOrData;
            const config = dataOrConfig as HttpRequestConfig;
            return this.executeRequest<T>(() =>
                this.httpService.put<T>(url, data, this.mergeConfig(config)),
            );
        }
    }

    /**
     * Make a PATCH request with DTO transformation
     */
    protected async patch<T>(
        url: string,
        dtoClass: ClassConstructor<T>,
        data?: any,
        config?: HttpRequestConfig,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T>>;
    /**
     * Make a PATCH request (original method)
     */
    protected async patch<T = any>(
        url: string,
        data?: any,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>>;
    /**
     * Implementation
     */
    protected async patch<T = any>(
        url: string,
        dtoClassOrData?: ClassConstructor<T> | any,
        dataOrConfig?: any | HttpRequestConfig,
        configOrTransformOptions?: HttpRequestConfig | TransformOptions,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T> | AxiosResponse<T>> {
        // Check if first parameter after url is a class constructor
        const isDtoTransformation = typeof dtoClassOrData === 'function';

        if (isDtoTransformation) {
            const dtoClass = dtoClassOrData as ClassConstructor<T>;
            const data = dataOrConfig;
            const config = configOrTransformOptions as HttpRequestConfig;
            const response = await this.executeRequest<T>(() =>
                this.httpService.patch<T>(url, data, this.mergeConfig(config)),
            );
            return this.transformResponse(response, dtoClass, transformOptions);
        } else {
            const data = dtoClassOrData;
            const config = dataOrConfig as HttpRequestConfig;
            return this.executeRequest<T>(() =>
                this.httpService.patch<T>(url, data, this.mergeConfig(config)),
            );
        }
    }

    /**
     * Make a DELETE request with DTO transformation
     */
    protected async delete<T>(
        url: string,
        dtoClass: ClassConstructor<T>,
        config?: HttpRequestConfig,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T>>;
    /**
     * Make a DELETE request (original method)
     */
    protected async delete<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>>;
    /**
     * Implementation
     */
    protected async delete<T = any>(
        url: string,
        dtoClassOrConfig?: ClassConstructor<T> | HttpRequestConfig,
        configOrTransformOptions?: HttpRequestConfig | TransformOptions,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T> | AxiosResponse<T>> {
        // Check if first parameter after url is a class constructor
        const isDtoTransformation = typeof dtoClassOrConfig === 'function';

        if (isDtoTransformation) {
            const dtoClass = dtoClassOrConfig as ClassConstructor<T>;
            const config = configOrTransformOptions as HttpRequestConfig;
            const response = await this.executeRequest<T>(() =>
                this.httpService.delete<T>(url, this.mergeConfig(config)),
            );
            return this.transformResponse(response, dtoClass, transformOptions);
        } else {
            const config = dtoClassOrConfig as HttpRequestConfig;
            return this.executeRequest<T>(() =>
                this.httpService.delete<T>(url, this.mergeConfig(config)),
            );
        }
    }

    /**
     * Make a request with any HTTP method and DTO transformation
     */
    protected async request<T>(
        config: HttpRequestConfig,
        dtoClass: ClassConstructor<T>,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T>>;
    /**
     * Make a request with any HTTP method (original method)
     */
    protected async request<T = any>(
        config: HttpRequestConfig,
    ): Promise<AxiosResponse<T>>;
    /**
     * Implementation
     */
    protected async request<T = any>(
        config: HttpRequestConfig,
        dtoClass?: ClassConstructor<T>,
        transformOptions?: TransformOptions,
    ): Promise<ApiResponse<T> | AxiosResponse<T>> {
        const response = await this.executeRequest<T>(() =>
            this.httpService.request<T>(this.mergeConfig(config)),
        );

        if (dtoClass) {
            return this.transformResponse(response, dtoClass, transformOptions);
        }

        return response;
    }

    /**
     * Merge default config with provided config
     */
    protected mergeConfig(config?: HttpRequestConfig): HttpRequestConfig {
        return {
            headers: { ...this.defaultHeaders, ...(config?.headers || {}) },
            ...config,
        };
    }

    /**
     * Add authorization header
     */
    protected withAuth(token: string, type = 'Bearer'): Record<string, string> {
        return {
            Authorization: `${type} ${token}`,
        };
    }

    /**
     * Normalize Axios headers to Record<string, string>
     */
    private normalizeHeaders(headers: any): Record<string, string> {
        const normalized: Record<string, string> = {};

        if (headers) {
            Object.keys(headers).forEach((key) => {
                const value = headers[key];
                normalized[key] =
                    typeof value === 'string' ? value : String(value);
            });
        }

        return normalized;
    }
}
