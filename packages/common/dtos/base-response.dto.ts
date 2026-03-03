import { SUCCESS_STATUS_CODE } from '../constants/error-code.const';

interface Metadata {
    statusCode: string;
    timestamp: Date;
    requestId: string;
    errors?: string[];
    pagination?: any;
}

export class BaseResponseDTO {
    public metadata: Metadata; // metadata
    public data?: unknown;

    constructor(metadata: Metadata, data: unknown) {
        this.metadata = metadata;
        this.data = data;
    }

    public static createSuccessResponse(data: unknown, metaData?: Metadata) {
        return new BaseResponseDTO(
            {
                statusCode: SUCCESS_STATUS_CODE,
                timestamp: new Date(),
                requestId: '',
                ...(metaData ?? {}),
            },
            data,
        );
    }

    public static createErrorResponse(
        metaData: Omit<Metadata, 'pagination'>,
        data?: unknown,
    ) {
        return new BaseResponseDTO(metaData, data);
    }
}
