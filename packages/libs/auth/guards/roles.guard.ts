import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUserDto } from '../dtos/jwt-payload.dto';
import { Role } from '../types/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly _reflector: Reflector) {}

    public canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this._reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user as AuthUserDto;

        if (!user) {
            throw new ForbiddenException('User not found in request');
        }

        const userRoles = user.roles ?? [];
        const hasRole = requiredRoles.some((role) => userRoles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
