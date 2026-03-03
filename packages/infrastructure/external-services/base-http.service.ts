import { Injectable, Logger } from '@nestjs/common';
import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
    CreateAxiosDefaults,
} from 'axios';

export interface HttpRequestConfig extends AxiosRequestConfig {
    retryAttempts?: number;
    retryDelay?: number;
    _retryCount?: number;
}

export interface HttpServiceOptions extends CreateAxiosDefaults {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    defaultRetryAttempts?: number;
    defaultRetryDelay?: number;
}

@Injectable()
export class BaseHttpService {
    private readonly logger = new Logger(BaseHttpService.name);
    private readonly axiosInstance: AxiosInstance;
    private readonly defaultRetryAttempts: number;
    private readonly defaultRetryDelay: number;

    constructor(options: HttpServiceOptions = {}) {
        const {
            defaultRetryAttempts = 3,
            defaultRetryDelay = 1000,
            ...axiosOptions
        } = options;

        this.defaultRetryAttempts = defaultRetryAttempts;
        this.defaultRetryDelay = defaultRetryDelay;

        this.axiosInstance = axios.create({
            timeout: 30000, // Default timeout: 30 seconds
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            ...axiosOptions,
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                this.logger.debug(
                    `Request: ${config.method?.toUpperCase()} ${config.url}`,
                    {
                        headers: config.headers,
                        params: config.params,
                        data: config.data,
                    },
                );
                return config;
            },
            (error) => {
                this.logger.error('Request error:', error);
                return Promise.reject(error);
            },
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response) => {
                this.logger.debug(
                    `Response: ${response.status} ${response.config.url}`,
                    {
                        data: response.data,
                        headers: response.headers,
                    },
                );
                return response;
            },
            async (error: AxiosError) => {
                if (!error.config) {
                    this.logger.error('Response error with no config:', error);
                    return Promise.reject(error);
                }

                const config = error.config as HttpRequestConfig;
                const retryAttempts =
                    config.retryAttempts ?? this.defaultRetryAttempts;
                const retryDelay = config.retryDelay ?? this.defaultRetryDelay;

                // Retry logic for network errors or specific HTTP status codes
                if (
                    (error.code === 'ECONNABORTED' ||
                        error.code === 'ETIMEDOUT' ||
                        !error.response ||
                        [408, 429, 500, 502, 503, 504].includes(
                            error.response?.status,
                        )) &&
                    (config._retryCount || 0) < retryAttempts
                ) {
                    config._retryCount = (config._retryCount || 0) + 1;

                    this.logger.warn(
                        `Retrying request (${config._retryCount}/${retryAttempts}): ${config.method?.toUpperCase()} ${config.url}`,
                        { error: error.message },
                    );

                    // Wait before retrying
                    await new Promise((resolve) =>
                        setTimeout(resolve, retryDelay),
                    );

                    return this.axiosInstance(config);
                }

                // Format error for better debugging
                const errorResponse = {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    config: {
                        url: error.config.url,
                        method: error.config.method,
                        headers: error.config.headers,
                        params: error.config.params,
                        data: error.config.data,
                    },
                    message: error.message,
                };

                this.logger.error('Response error:', errorResponse);
                return Promise.reject(error);
            },
        );
    }

    /**
     * Make a GET request
     */
    public async get<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>> {
        return this.axiosInstance.get<T>(url, {
            _retryCount: 0,
            ...config,
        } as HttpRequestConfig);
    }

    /**
     * Make a POST request
     */
    public async post<T = any>(
        url: string,
        data?: any,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>> {
        return this.axiosInstance.post<T>(url, data, {
            _retryCount: 0,
            ...config,
        } as HttpRequestConfig);
    }

    /**
     * Make a PUT request
     */
    public async put<T = any>(
        url: string,
        data?: any,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>> {
        return this.axiosInstance.put<T>(url, data, {
            _retryCount: 0,
            ...config,
        } as HttpRequestConfig);
    }

    /**
     * Make a PATCH request
     */
    public async patch<T = any>(
        url: string,
        data?: any,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>> {
        return this.axiosInstance.patch<T>(url, data, {
            _retryCount: 0,
            ...config,
        } as HttpRequestConfig);
    }

    /**
     * Make a DELETE request
     */
    public async delete<T = any>(
        url: string,
        config?: HttpRequestConfig,
    ): Promise<AxiosResponse<T>> {
        return this.axiosInstance.delete<T>(url, {
            _retryCount: 0,
            ...config,
        } as HttpRequestConfig);
    }

    /**
     * Make a request with any HTTP method
     */
    public async request<T = any>(
        config: HttpRequestConfig,
    ): Promise<AxiosResponse<T>> {
        return this.axiosInstance.request<T>({
            _retryCount: 0,
            ...config,
        } as HttpRequestConfig);
    }

    /**
     * Create a new instance of HttpService with custom configuration
     */
    public createInstance(options: HttpServiceOptions): BaseHttpService {
        return new BaseHttpService(options);
    }
}
