import { SUCCESS_STATUS_CODE } from "../constants/error-code.const";
import { BaseResponseDTO } from "../dtos/base-response.dto";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { map, Observable } from "rxjs";

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
    constructor(private readonly clsService: ClsService) {}

    public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                return BaseResponseDTO.createSuccessResponse(data, {
                    requestId: this.clsService.getId(),
                    timestamp: new Date(),
                    statusCode: SUCCESS_STATUS_CODE,
                });
            }),
        );
    }
}