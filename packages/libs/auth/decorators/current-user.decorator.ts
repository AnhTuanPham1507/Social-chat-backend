import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AuthUserDto } from '../dtos/jwt-payload.dto';

export const CurrentUser = createParamDecorator(
    (data: keyof AuthUserDto | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as AuthUserDto | undefined;

        if (!user) {
            throw new UnauthorizedException();
        }

        return data ? user[data] : user;
    },
);
