import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

import {
    IAM_SERVICE_TOKEN,
    IIAMService,
} from '../contracts/iam-service.contract';
import { IJwtPayload } from '../dtos/jwt.dto';

@Injectable()
export class JwtService {
    constructor(
        @Inject(IAM_SERVICE_TOKEN)
        private readonly iamService: IIAMService,
    ) {}

    public async verifyToken(token: string): Promise<IJwtPayload> {
        const decoded = jwt.decode(token, { complete: true });
        const kid = decoded?.header?.kid;
        if (!kid) {
            throw new UnauthorizedException();
        }

        const publicKey = await this.iamService.getSigningKey(kid);
        if (!publicKey) {
            throw new UnauthorizedException();
        }

        return jwt.verify(token, publicKey) as IJwtPayload;
    }
}
