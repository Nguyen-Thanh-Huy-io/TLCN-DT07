import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE_GROUPS } from '../common/access/access.constant';
import { RequireRoles } from '../common/access/access.decorator';
import {
  CreateAchievementDto,
  QueryAdminLearnersDto,
  UpdateAchievementDto,
} from './dto/gamification-admin.dto';
import { GAMIFICATION_ROUTES } from './gamification.constant';
import { GamificationAdminService } from './services/gamification-admin.service';

@ApiTags('Gamification Admin - Quản trị Huy hiệu & Nhịp học tập')
@RequireRoles(...ROLE_GROUPS.REVIEWERS)
@Controller(GAMIFICATION_ROUTES.ROOT)
export class GamificationAdminController {
  constructor(private readonly adminService: GamificationAdminService) {}

  @Get(GAMIFICATION_ROUTES.ADMIN_OVERVIEW)
  @ApiOperation({
    summary: 'Thống kê Gamification toàn hệ thống và danh mục huy hiệu',
  })
  getOverview() {
    return this.adminService.getAdminOverview();
  }

  @Get(GAMIFICATION_ROUTES.ADMIN_LEARNERS)
  @ApiOperation({
    summary: 'Danh sách / xếp hạng học viên theo XP, chuỗi ngày, hoạt động',
  })
  listLearners(@Query() query: QueryAdminLearnersDto) {
    return this.adminService.listLearners(query);
  }

  @Post(GAMIFICATION_ROUTES.ADMIN_ACHIEVEMENTS)
  @ApiOperation({ summary: 'Tạo huy hiệu thành tựu mới' })
  createAchievement(@Body() dto: CreateAchievementDto) {
    return this.adminService.createAchievement(dto);
  }

  @Patch(GAMIFICATION_ROUTES.ADMIN_ACHIEVEMENT_BY_ID)
  @ApiOperation({
    summary: 'Chỉnh sửa thông tin, ngưỡng đạt, XP hoặc bật/tắt huy hiệu',
  })
  updateAchievement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAchievementDto,
  ) {
    return this.adminService.updateAchievement(id, dto);
  }

  @Delete(GAMIFICATION_ROUTES.ADMIN_ACHIEVEMENT_BY_ID)
  @ApiOperation({
    summary: 'Xoá huy hiệu (chỉ cho xoá khi chưa có học viên nào đạt)',
  })
  deleteAchievement(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteAchievement(id);
  }
}
