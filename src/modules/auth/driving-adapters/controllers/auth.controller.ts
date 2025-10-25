import { ASSET_TYPE } from '@modules/asset/domain/entities/asset/asset-type.value-object';
import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';
import {
    Controller,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Get,
    Request,
    Res,
    UseInterceptors,
    UploadedFile,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ClsService } from 'nestjs-cls';

import {
    AUTH_APPLICATION_SERVICE_TOKEN,
    IAuthApplicationService,
} from '../../application/application-services/auth.application-service';
import ENDPOINT from '../../constants/endpoint.constant';
import RegisterPayloadDTO, { LoginPayloadDTO } from '../dtos/auth.dto';

@Controller(ENDPOINT.AUTH.BASE)
@ApiTags('Auth')
export class AuthController {
    constructor(
        @Inject(AUTH_APPLICATION_SERVICE_TOKEN)
        private readonly _authApplicationService: IAuthApplicationService,
        private readonly _clsService: ClsService,
    ) {}

    @Post(ENDPOINT.AUTH.LOGIN)
    @HttpCode(HttpStatus.OK)
    @ApiBody({
        type: LoginPayloadDTO,
    })
    public login(@Request() req, @Res() res: Response): void {}

    @Post(ENDPOINT.AUTH.SIGNUP)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: RegisterPayloadDTO,
    })
    @UseInterceptors(FileInterceptor('avatar'))
    public async signupByEmail(
        @Body() userData: RegisterPayloadDTO,
        @UploadedFile() avatar: Express.Multer.File,
    ) {
        if (avatar) {
            userData.avatar = {
                fileName: avatar.originalname,
                fileBuffer: avatar.buffer,
                fileSize: avatar.size,
                mimeType: avatar.mimetype as MIME_TYPE,
                assetType: ASSET_TYPE.IMAGE,
            };
        }

        return this._authApplicationService.signUpByEmail(userData);
    }

    @Get('/debug/request-id')
    @HttpCode(HttpStatus.OK)
    public debugRequestId(@Request() req): any {
        console.log('=== DEBUG REQUEST ID ===');
        console.log('ClsService ID:', this._clsService.getId());
        console.log('Request header x-request-id:', req.headers['x-request-id']);
        console.log('All headers:', req.headers);
        console.log('========================');
        
        return {
            clsId: this._clsService.getId(),
            headerRequestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString(),
        };
    }
}
