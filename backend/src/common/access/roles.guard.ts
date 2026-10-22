import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ACCESS_MESSAGES, ROLES_METADATA_KEY } from './access.constant';

export interface AuthenticatedUser {
  userId: string;
  role: string;
}

export function currentUser(request: Request): AuthenticatedUser | undefined {
  return (request as Request & { user?: AuthenticatedUser }).user;
}

/** Chạy sau AuthGuard: so vai trò trong access token với danh sách cho phép của endpoint. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<
      readonly string[] | undefined
    >(ROLES_METADATA_KEY, [context.getHandler(), context.getClass()]);
    if (!allowed?.length) return true;
    const user = currentUser(context.switchToHttp().getRequest<Request>());
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException(ACCESS_MESSAGES.FORBIDDEN_ROLE);
    }
    return true;
  }
}
