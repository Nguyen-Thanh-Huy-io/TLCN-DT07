import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../services/prisma.service';
import {
  ACCESS_MESSAGES,
  CONTENT_RESOURCE_METADATA_KEY,
  EDITOR_ALLOWED_STATUSES,
  LOCKED_FOR_EDITORS,
  ROLE_GROUPS,
} from './access.constant';
import { currentUser } from './roles.guard';
import { VERSIONED_MODELS } from '../../content-revision/content-revision.constant';
import {
  REVISION_DIRECTIVE_KEY,
  type RevisionDirective,
} from '../../content-revision/content-revision.interceptor';

/** Model có cột `status` mà endpoint ghi tác động tới, và tên route param chứa id của nó. */
export interface ContentResource {
  model:
    | 'lesson'
    | 'historicalEvent'
    | 'historicalEntity'
    | 'period'
    | 'topic'
    | 'learningPath'
    | 'chapter';
  idParam?: string;
  /**
   * Endpoint cập nhật chính của nội dung có phiên bản hóa: sửa nội dung đang xuất bản không bị chặn
   * mà thành bản sửa chờ duyệt (biên tập viên) hoặc được chụp lịch sử trước khi sửa (người duyệt).
   */
  versioned?: boolean;
}

/**
 * Chạy sau AuthGuard cho mọi endpoint ghi nội dung CMS:
 *  1. chỉ nhân sự (biên tập viên trở lên) được ghi;
 *  2. biên tập viên chỉ đặt được trạng thái nháp/chờ duyệt;
 *  3. biên tập viên không sửa/xóa nội dung đã xuất bản hoặc lưu trữ.
 * Bài học còn bị chặn đặt PUBLISHED/REJECTED trực tiếp — phải đi qua endpoint duyệt.
 */
@Injectable()
export class ContentWriteGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = currentUser(request);
    if (
      !user ||
      !(ROLE_GROUPS.STAFF as readonly string[]).includes(user.role)
    ) {
      throw new ForbiddenException(ACCESS_MESSAGES.FORBIDDEN_ROLE);
    }

    const resource = this.reflector.get<ContentResource | undefined>(
      CONTENT_RESOURCE_METADATA_KEY,
      context.getHandler(),
    );
    const isReviewer = (ROLE_GROUPS.REVIEWERS as readonly string[]).includes(
      user.role,
    );
    const nextStatus = (request.body as { status?: unknown } | undefined)
      ?.status;

    const id =
      resource?.idParam && typeof request.params[resource.idParam] === 'string'
        ? (request.params[resource.idParam] as string)
        : null;
    const current = id && resource ? await this.findStatus(resource.model, id) : null;

    // Sửa nội dung đang xuất bản qua endpoint có phiên bản hóa → phiên bản (không chặn).
    const versionedType = resource?.versioned ? VERSIONED_MODELS[resource.model] : undefined;
    if (versionedType && id && current === 'PUBLISHED') {
      const directive: RevisionDirective = {
        mode: isReviewer ? 'SNAPSHOT' : 'PROPOSE',
        type: versionedType,
        contentId: id,
      };
      (request as Request & { [REVISION_DIRECTIVE_KEY]?: RevisionDirective })[
        REVISION_DIRECTIVE_KEY
      ] = directive;
      // Bản sửa của biên tập viên không mang trạng thái (status bị bỏ khi lưu bản sửa).
      if (!isReviewer) return true;
    }

    if (typeof nextStatus === 'string') {
      if (
        resource?.model === 'lesson' &&
        ['PUBLISHED', 'REJECTED'].includes(nextStatus)
      ) {
        throw new ForbiddenException(ACCESS_MESSAGES.LESSON_PUBLISH_VIA_REVIEW);
      }
      if (!isReviewer && !EDITOR_ALLOWED_STATUSES.includes(nextStatus)) {
        throw new ForbiddenException(ACCESS_MESSAGES.EDITOR_CANNOT_PUBLISH);
      }
    }

    if (!isReviewer && current && LOCKED_FOR_EDITORS.includes(current)) {
      throw new ForbiddenException(ACCESS_MESSAGES.EDITOR_LOCKED);
    }
    return true;
  }

  private async findStatus(
    model: ContentResource['model'],
    id: string,
  ): Promise<string | null> {
    const where = { where: { id }, select: { status: true } } as const;
    const row = await {
      lesson: () => this.prisma.lesson.findUnique(where),
      historicalEvent: () => this.prisma.historicalEvent.findUnique(where),
      historicalEntity: () => this.prisma.historicalEntity.findUnique(where),
      period: () => this.prisma.period.findUnique(where),
      topic: () => this.prisma.topic.findUnique(where),
      learningPath: () => this.prisma.learningPath.findUnique(where),
      chapter: () => this.prisma.chapter.findUnique(where),
    }[model]();
    return row?.status ?? null;
  }
}
