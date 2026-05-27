import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Service-to-service shared-secret guard.
 *
 * Protects internal endpoints that are called by trusted in-cluster
 * services (e.g. the realtime-gateway) and never by end-user clients.
 * The token lives in `INTERNAL_SERVICE_TOKEN` env and must be set on both
 * sides. We avoid wiring this through the public JwtGuard because the
 * caller identity is "another service," not "an end user" — keeping the
 * trust boundary explicit.
 *
 * Trust model: the calling service is responsible for asserting which
 * end-user the request is for (e.g. via `userId` in the body). The token
 * authorizes the *service*; the body asserts the *subject*.
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest<Request>();
        const presented = req.headers['x-internal-token'];
        const expected = process.env.INTERNAL_SERVICE_TOKEN;

        if (!expected) {
            throw new UnauthorizedException(
                'INTERNAL_SERVICE_TOKEN not configured on this service',
            );
        }
        if (typeof presented !== 'string' || presented !== expected) {
            throw new UnauthorizedException('Invalid internal token');
        }
        return true;
    }
}
