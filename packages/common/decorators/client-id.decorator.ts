import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ClientId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return (request.headers['x-client-id'] as string) || undefined;
    },
);
