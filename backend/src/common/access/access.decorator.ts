import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import {
  CONTENT_RESOURCE_METADATA_KEY,
  ROLES_METADATA_KEY,
} from './access.constant';
import { ContentWriteGuard, type ContentResource } from './content-write.guard';
import { RolesGuard } from './roles.guard';

/** Đăng nhập + thuộc một trong các vai trò cho phép. */
export function RequireRoles(...roles: readonly string[]) {
  return applyDecorators(
    SetMetadata(ROLES_METADATA_KEY, roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth('JWT-auth'),
    ApiForbiddenResponse({ description: 'Vai trò không đủ quyền' }),
  );
}

/** Endpoint ghi nội dung CMS — xem ContentWriteGuard. */
export function ContentWrite(resource?: ContentResource) {
  return applyDecorators(
    SetMetadata(CONTENT_RESOURCE_METADATA_KEY, resource),
    UseGuards(AuthGuard, ContentWriteGuard),
    ApiBearerAuth('JWT-auth'),
    ApiForbiddenResponse({ description: 'Không đủ quyền biên tập/xuất bản' }),
  );
}
