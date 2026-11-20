import { Controller, Get, HttpStatus, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ReviewQueueService } from './review-queue.service';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview.dto';
import { ReviewQueueResponseDto } from './dto/review-queue.dto';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';
import type { AuthenticatedRequest } from '../common/access/roles.guard';

@ApiTags('Dashboard - Thống kê & Tổng quan CMS')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly reviewQueueService: ReviewQueueService,
  ) {}

  @Get('overview')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary:
      'Tổng quan CMS: kho nội dung theo trạng thái, việc chờ duyệt, việc của tôi',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DashboardOverviewResponseDto })
  getOverview(
    @Req() req: AuthenticatedRequest,
  ): Promise<DashboardOverviewResponseDto> {
    // RequireRoles đã bảo đảm có người dùng đăng nhập.
    return this.dashboardService.getOverview(req.user?.userId ?? '');
  }

  @Get('review-queue')
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({
    summary:
      'Hàng chờ duyệt gộp: bản sửa, bài viết, bài học, blog, báo cáo — chờ lâu nhất trước',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ReviewQueueResponseDto })
  getReviewQueue(): Promise<ReviewQueueResponseDto> {
    return this.reviewQueueService.getQueue();
  }
}
