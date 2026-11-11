import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../config/app.config';

/**
 * OptionalAuthGuard — luôn cho qua.
 * Nếu có Bearer token hợp lệ thì gắn `req.user`, ngược lại bỏ qua (khách vãng lai).
 * Dùng cho endpoint public cần biết "người xem hiện tại" (vd: likedByMe).
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = (request.headers.authorization ?? '').split(' ');

    if (type === 'Bearer' && token) {
      try {
        const payload = jwt.verify(token, config.jwt_access_secret);
        Object.assign(request, { user: payload });
      } catch {
        // Token không hợp lệ → coi như khách
      }
    }

    return true;
  }
}
