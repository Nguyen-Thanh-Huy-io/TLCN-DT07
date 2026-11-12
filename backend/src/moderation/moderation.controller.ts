import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportTargetType, userRole } from '@prisma/client';
import type { Request } from 'express';
import { RequireRoles } from '../common/access/access.decorator';
import {
  ListModerationReportsQueryDto,
  ResolveModerationReportDto,
} from './dto/moderation.dto';
import { ModerationService } from './moderation.service';

type AuthedRequest = Request & { user: { userId: string; role: string } };

@ApiTags('Moderation (AI Sentinel & CMS)')
@Controller('moderation')
@RequireRoles(userRole.MODERATOR, userRole.ADMIN, userRole.SUPERADMIN)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @ApiOperation({
    summary:
      'Danh sách báo cáo vi phạm (do AI Sentinel quét hoặc người dùng báo cáo) kèm thống kê',
  })
  @Get('reports')
  listReports(@Query() query: ListModerationReportsQueryDto) {
    return this.moderationService.listReports(query);
  }

  @ApiOperation({
    summary:
      'Thao tác 1-Click xử lý báo cáo vi phạm: CONFIRM_REMOVE (xác nhận xóa), RESTORE (khôi phục bài), BAN_USER (khóa tài khoản tái phạm)',
  })
  @Patch('reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  resolveReport(
    @Param('id') reportId: string,
    @Req() req: AuthedRequest,
    @Body() dto: ResolveModerationReportDto,
  ) {
    return this.moderationService.resolveReport(reportId, req.user.userId, dto);
  }

  @ApiOperation({
    summary:
      'Quét kiểm duyệt lại thủ công một bài viết hoặc bình luận bằng AI Sentinel',
  })
  @Post('scan/:targetType/:targetId')
  @HttpCode(HttpStatus.OK)
  scanTarget(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ) {
    const normalizedType =
      targetType.toUpperCase() === ReportTargetType.COMMENT
        ? ReportTargetType.COMMENT
        : ReportTargetType.POST;
    return this.moderationService.scanTarget(normalizedType, targetId, {
      forceExecution: true,
    });
  }
}
