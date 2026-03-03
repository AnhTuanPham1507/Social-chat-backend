import {
    API_NOT_FOUND_STATUS_CODE,
    FORBIDDEN_STATUS_CODE,
    INTERNAL_SERVER_ERROR_STATUS_CODE,
    VALIDATION_ERROR_STATUS_CODE,
} from '../constants/error-code.const';
import { BaseResponseDTO } from '../dtos/base-response.dto';
import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
    constructor(private readonly clsService: ClsService) {}

    public catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const requestId = this.clsService.getId();
        const timestamp = new Date();

        if (exception instanceof HttpException) {
            response
                .status(exception.getStatus())
                .json(
                    this._handleInfraException(exception, requestId, timestamp),
                );
        } else {
            response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json(
                    this._handleUnknownException(
                        exception,
                        requestId,
                        timestamp,
                    ),
                );
        }

        this.logger.error(
            `Error: ${exception.message} with request id ${requestId}`,
            exception.stack,
        );
    }

    private _handleInfraException(
        exception: HttpException,
        requestId: string,
        timestamp: Date,
    ) {
        const statusCode = this._mapHttpStatusToErrorCode(
            exception.getStatus(),
        );
        const response = exception.getResponse();

        // Handle validation errors specifically
        if (
            exception instanceof BadRequestException &&
            this._isValidationError(response)
        ) {
            const validationErrors = this._extractValidationErrors(response);
            return BaseResponseDTO.createErrorResponse({
                statusCode,
                requestId,
                timestamp,
                errors: validationErrors,
            });
        }

        // Handle other HTTP exceptions
        const message =
            typeof response === 'string'
                ? response
                : (response as any)?.message || exception.message;
        return BaseResponseDTO.createErrorResponse({
            statusCode,
            requestId,
            timestamp,
            errors: Array.isArray(message) ? message : [message],
        });
    }

    private _handleUnknownException(
        exception: any,
        requestId: string,
        timestamp: Date,
    ) {
        const errorMessage = exception.message ?? 'Internal server error';

        return BaseResponseDTO.createErrorResponse({
            statusCode: INTERNAL_SERVER_ERROR_STATUS_CODE,
            requestId,
            timestamp,
            errors: [errorMessage],
        });
    }

    /**
     * Helper method to check if the exception response contains validation errors
     */
    private _isValidationError(response: any): boolean {
        return (
            response &&
            typeof response === 'object' &&
            Array.isArray(response.message) &&
            response.error === 'Bad Request'
        );
    }

    /**
     * Helper method to extract and format validation errors from class-validator
     */
    private _extractValidationErrors(response: any): string[] {
        if (!Array.isArray(response.message)) {
            return [response.message || 'Validation error'];
        }

        return response.message.map((error: any) => {
            if (typeof error === 'string') {
                return error;
            }

            // Handle ValidationError objects from class-validator
            if (error.constraints && typeof error.constraints === 'object') {
                const field = error.property || 'field';
                const messages = Object.values(error.constraints) as string[];
                return `${field}: ${messages.join(', ')}`;
            }

            // Handle nested validation errors
            if (error.children && Array.isArray(error.children)) {
                const nestedErrors = this._extractNestedValidationErrors(
                    error.children,
                    error.property,
                );
                return nestedErrors.join('; ');
            }

            return error.toString();
        });
    }

    /**
     * Helper method to extract nested validation errors
     */
    private _extractNestedValidationErrors(
        children: any[],
        parentProperty?: string,
    ): string[] {
        const errors: string[] = [];

        for (const child of children) {
            const fieldPath = parentProperty
                ? `${parentProperty}.${child.property}`
                : child.property;

            if (child.constraints) {
                const messages = Object.values(child.constraints) as string[];
                errors.push(`${fieldPath}: ${messages.join(', ')}`);
            }

            if (child.children && Array.isArray(child.children)) {
                errors.push(
                    ...this._extractNestedValidationErrors(
                        child.children,
                        fieldPath,
                    ),
                );
            }
        }

        return errors;
    }

    private _mapHttpStatusToErrorCode(status: number) {
        switch (status) {
            case HttpStatus.NOT_FOUND:
                return API_NOT_FOUND_STATUS_CODE;
            case HttpStatus.BAD_REQUEST:
                return VALIDATION_ERROR_STATUS_CODE;
            case HttpStatus.FORBIDDEN:
                return FORBIDDEN_STATUS_CODE;
            default:
                return INTERNAL_SERVER_ERROR_STATUS_CODE;
        }
    }
}
