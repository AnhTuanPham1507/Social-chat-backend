import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { IAccessTokenPayload } from '../dtos/jwt-payload.dto';

export const CurrentUser = createParamDecorator(
    (data: keyof IAccessTokenPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as IAccessTokenPayload | undefined;

        if (!user) {
            return undefined;
        }

        return data ? user[data] : user;
    },
);
