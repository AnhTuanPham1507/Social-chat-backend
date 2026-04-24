import { Inject, Injectable } from '@nestjs/common';

import { AuthTokens, ExchangeTokenInput } from '../dtos/auth.dto';
import {
  IAM_SERVICE_TOKEN,
  IIAMService,
} from '../contracts/iam-service.contract';
import {
  IUserService,
  USER_SERVICE_TOKEN,
} from '../contracts/user-service.contract';
import { IIdTokenPayload } from '@application/dtos/jwt.dto';

export const AUTH_APPLICATION_SERVICE_TOKEN = 'AUTH_APPLICATION_SERVICE_TOKEN';

export interface IAuthApplicationService {
  authCallback(payload: ExchangeTokenInput, clientId?: string): Promise<AuthTokens>;
}

@Injectable()
export class AuthApplicationService implements IAuthApplicationService {
  constructor(
    @Inject(IAM_SERVICE_TOKEN)
    private readonly _iamService: IIAMService,

    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService,
  ) {}

  public async authCallback(payload: ExchangeTokenInput): Promise<AuthTokens> {
    const authTokens = await this._iamService.exchangeCodeForToken(payload);

    const idTokenPayload = await this._iamService.verifyToken<IIdTokenPayload>(
      authTokens.idToken,
    );

    await this._userService.createUser(
      idTokenPayload.sub,
      idTokenPayload.email,
      idTokenPayload.name,
    );

    return authTokens;
  }
}
