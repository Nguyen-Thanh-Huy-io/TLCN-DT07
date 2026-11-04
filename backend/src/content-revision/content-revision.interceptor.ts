import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { from, Observable, switchMap } from 'rxjs';
import { currentUser } from '../common/access/roles.guard';
import { RevisionContentType } from './content-revision.constant';
import { ContentRevisionService } from './content-revision.service';

/** Do ContentWriteGuard gắn vào request khi lệnh sửa chạm nội dung đang xuất bản. */
export interface RevisionDirective {
  /** PROPOSE: biên tập viên → lưu bản sửa chờ duyệt · SNAPSHOT: người duyệt → chụp lịch sử rồi sửa. */
  mode: 'PROPOSE' | 'SNAPSHOT';
  type: RevisionContentType;
  contentId: string;
}

export const REVISION_DIRECTIVE_KEY = 'contentRevision';

export function revisionDirectiveOf(request: Request): RevisionDirective | undefined {
  return (request as Request & { [REVISION_DIRECTIVE_KEY]?: RevisionDirective })[
    REVISION_DIRECTIVE_KEY
  ];
}

@Injectable()
export class ContentRevisionInterceptor implements NestInterceptor {
  constructor(private readonly revisions: ContentRevisionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const directive = revisionDirectiveOf(request);
    if (!directive) return next.handle();
    const userId = currentUser(request)?.userId ?? null;

    if (directive.mode === 'PROPOSE') {
      // Không gọi handler: bản công khai giữ nguyên, thay đổi nằm trong bản sửa chờ duyệt.
      return from(
        this.revisions.propose(
          directive.type,
          directive.contentId,
          (request.body ?? {}) as Record<string, unknown>,
          userId ?? '',
        ),
      );
    }
    return from(
      this.revisions.snapshot(directive.type, directive.contentId, userId),
    ).pipe(switchMap(() => next.handle()));
  }
}
