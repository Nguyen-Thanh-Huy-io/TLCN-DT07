import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview.dto';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';

@ApiTags('Dashboard - Thống kê & Tổng quan CMS')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary: 'Lấy dữ liệu tổng quan và thống kê hệ thống cho CMS Dashboard',
    description:
      'Tổng hợp số lượng giai đoạn, chủ đề, bài học, danh sách chờ duyệt và hoạt động cập nhật mới nhất.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy dữ liệu tổng quan thành công',
    type: DashboardOverviewResponseDto,
  })
  async getOverview(): Promise<DashboardOverviewResponseDto> {
    return this.dashboardService.getOverview();
  }
}
