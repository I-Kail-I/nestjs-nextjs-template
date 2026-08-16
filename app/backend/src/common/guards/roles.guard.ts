import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { Role } from '@/generated/prisma/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: { role?: Role } }>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Not authenticated');
    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
