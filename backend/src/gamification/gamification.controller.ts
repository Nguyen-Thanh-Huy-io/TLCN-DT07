import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { CreateGoalDto, UpdateGoalStatusDto } from './dto/gamification.dto';
import { GAMIFICATION_ROUTES } from './gamification.constant';
import { AchievementService } from './services/achievement.service';
import { GamificationFacadeService } from './services/gamification-facade.service';
import { GoalService } from './services/goal.service';

interface AuthedRequest {
  user: { userId: string };
}

@ApiTags('Gamification - Chuỗi ngày học, Mục tiêu & Thành tựu')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller(GAMIFICATION_ROUTES.ROOT)
export class GamificationController {
  constructor(
    private readonly facade: GamificationFacadeService,
    private readonly goalService: GoalService,
    private readonly achievementService: AchievementService,
  ) {}

  @Get(GAMIFICATION_ROUTES.OVERVIEW)
  @ApiOperation({
    summary: 'Tổng quan chuỗi ngày/tuần học, XP, cấp bậc, mục tiêu và huy hiệu',
  })
  async getOverview(@Req() req: AuthedRequest) {
    await this.achievementService.ensureDefaultSeeded();
    return this.facade.getOverview(req.user.userId);
  }

  @Get(GAMIFICATION_ROUTES.GOALS)
  @ApiOperation({ summary: 'Danh sách mục tiêu học tập hiện tại' })
  listGoals(@Req() req: AuthedRequest) {
    return this.goalService.listGoals(req.user.userId);
  }

  @Post(GAMIFICATION_ROUTES.GOALS)
  @ApiOperation({ summary: 'Đặt / cam kết mục tiêu học tập mới' })
  createGoal(@Req() req: AuthedRequest, @Body() dto: CreateGoalDto) {
    return this.goalService.createGoal(req.user.userId, dto);
  }

  @Patch(GAMIFICATION_ROUTES.GOAL_BY_ID)
  @ApiOperation({ summary: 'Cập nhật trạng thái mục tiêu' })
  updateGoalStatus(
    @Req() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalStatusDto,
  ) {
    return this.goalService.updateGoalStatus(req.user.userId, id, dto);
  }

  @Delete(GAMIFICATION_ROUTES.GOAL_BY_ID)
  @ApiOperation({ summary: 'Xoá mục tiêu học tập' })
  deleteGoal(
    @Req() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalService.deleteGoal(req.user.userId, id);
  }

  @Post(GAMIFICATION_ROUTES.ARTICLE_READ_COMPLETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Đánh dấu đã đọc xong một bài viết lịch sử (tính chuỗi & mục tiêu)',
  })
  markArticleReadComplete(
    @Req() req: AuthedRequest,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return this.facade.markArticleReadComplete(req.user.userId, articleId);
  }

  @Get(GAMIFICATION_ROUTES.ARTICLE_READ_STATUS)
  @ApiOperation({ summary: 'Kiểm tra bài viết đã được đánh dấu đọc xong chưa' })
  getArticleReadStatus(
    @Req() req: AuthedRequest,
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    return this.facade.isArticleReadCompleted(req.user.userId, articleId);
  }
}
