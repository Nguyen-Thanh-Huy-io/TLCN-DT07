import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';
import { currentUser } from '../common/access/roles.guard';
import { REVISION_ROUTES } from './content-revision.constant';
import { ReviewRevisionDto } from './dto/content-revision.dto';
import { ContentRevisionService } from './content-revision.service';

const userIdOf = (req: Request) => currentUser(req)?.userId ?? '';

@ApiTags('Content revisions (Phiên bản nội dung)')
@Controller()
export class ContentRevisionController {
  constructor(private readonly revisions: ContentRevisionService) {}

  @Get(REVISION_ROUTES.PENDING)
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Bản sửa của nội dung đã xuất bản đang chờ duyệt' })
  pending() {
    return this.revisions.pending();
  }

  @Get(REVISION_ROUTES.CONTENT)
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Lịch sử phiên bản của một nội dung (LESSON | EVENT | ENTITY)' })
  history(@Param('type') type: string, @Param('id') id: string) {
    return this.revisions.history(type.toUpperCase(), id);
  }

  @Get(REVISION_ROUTES.OPEN_DRAFT)
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Bản sửa đang chờ, phủ lên chi tiết để form CMS mở tiếp' })
  openDraft(@Param('type') type: string, @Param('id') id: string) {
    return this.revisions.openDraft(type.toUpperCase(), id);
  }

  @Get(REVISION_ROUTES.ONE)
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Chi tiết phiên bản + các trường khác với nội dung hiện tại' })
  detail(@Param('revisionId') id: string) {
    return this.revisions.detail(id);
  }

  @Post(REVISION_ROUTES.APPROVE)
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({ summary: 'Duyệt bản sửa: áp dụng lên nội dung, bản cũ vào lịch sử' })
  approve(@Param('revisionId') id: string, @Body() dto: ReviewRevisionDto, @Req() req: Request) {
    return this.revisions.approve(id, userIdOf(req), dto.note);
  }

  @Post(REVISION_ROUTES.REJECT)
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({ summary: 'Từ chối bản sửa (bắt buộc ghi lý do)' })
  reject(@Param('revisionId') id: string, @Body() dto: ReviewRevisionDto, @Req() req: Request) {
    return this.revisions.reject(id, userIdOf(req), dto.note ?? '');
  }

  @Post(REVISION_ROUTES.RESTORE)
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({ summary: 'Khôi phục một phiên bản trong lịch sử' })
  restore(@Param('revisionId') id: string, @Req() req: Request) {
    return this.revisions.restore(id, userIdOf(req));
  }
}
