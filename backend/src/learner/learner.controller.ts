import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { LearnerHistoryQueryDto } from './dto/learner-history.dto';
import { LearnerService } from './learner.service';
import { LEARNER_ROUTES } from './learner.constant';

interface AuthedRequest {
  user: { userId: string };
}

@ApiTags('Learner - Đăng ký lộ trình & tiến độ học')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller(LEARNER_ROUTES.ROOT)
export class LearnerController {
  constructor(private readonly learnerService: LearnerService) {}

  @Get()
  @ApiOperation({
    summary: 'Lộ trình đã đăng ký và bài đã hoàn thành của người học hiện tại',
  })
  getOverview(@Req() req: AuthedRequest) {
    return this.learnerService.getOverview(req.user.userId);
  }

  @Post(LEARNER_ROUTES.ENROLL)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký (miễn phí) một lộ trình đã xuất bản' })
  @ApiParam({ name: 'learningPathId', type: String })
  enroll(
    @Req() req: AuthedRequest,
    @Param('learningPathId') learningPathId: string,
  ) {
    return this.learnerService.enroll(req.user.userId, learningPathId);
  }

  @Delete(LEARNER_ROUTES.ENROLL)
  @ApiOperation({ summary: 'Hủy đăng ký một lộ trình' })
  @ApiParam({ name: 'learningPathId', type: String })
  unenroll(
    @Req() req: AuthedRequest,
    @Param('learningPathId') learningPathId: string,
  ) {
    return this.learnerService.unenroll(req.user.userId, learningPathId);
  }

  @Get(LEARNER_ROUTES.PATH_PROGRESSION)
  @ApiOperation({
    summary:
      'Sơ đồ tiến trình chi tiết của lộ trình (Roadmap nodes) kèm trạng thái từng bài',
  })
  @ApiParam({ name: 'learningPathId', type: String })
  getPathProgression(
    @Req() req: AuthedRequest,
    @Param('learningPathId') learningPathId: string,
  ) {
    return this.learnerService.getPathProgression(
      req.user.userId,
      learningPathId,
    );
  }

  @Get(LEARNER_ROUTES.LESSON)
  @ApiOperation({
    summary: 'Nội dung bài học, chỉ khi người học được phép đọc',
  })
  @ApiParam({ name: 'slug', type: String })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'NOT_ENROLLED hoặc LESSON_LOCKED_SEQUENTIAL',
  })
  getLesson(
    @Req() req: AuthedRequest,
    @Param('slug') slug: string,
    @Query('pathId') pathId?: string,
  ) {
    return this.learnerService.getLessonForReading(
      req.user.userId,
      slug,
      pathId,
    );
  }

  @Post(LEARNER_ROUTES.COMPLETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đánh dấu đã hoàn thành một bài học' })
  @ApiParam({ name: 'lessonId', type: String })
  completeLesson(
    @Req() req: AuthedRequest,
    @Param('lessonId') lessonId: string,
  ) {
    return this.learnerService.completeLesson(req.user.userId, lessonId);
  }

  @Get(LEARNER_ROUTES.HISTORY)
  @ApiOperation({
    summary:
      'Nhật ký học tập cá nhân có phân trang (Đề đã làm / Bài học đã hoàn thành / Bài viết đã đọc)',
  })
  getHistory(
    @Req() req: AuthedRequest,
    @Query() query: LearnerHistoryQueryDto,
  ) {
    return this.learnerService.getHistory(req.user.userId, query);
  }

  @Get(LEARNER_ROUTES.QUIZ_ATTEMPT_DETAIL)
  @ApiOperation({
    summary: 'Xem lại chi tiết đáp án và lời giải của một lượt làm bài cũ',
  })
  @ApiParam({ name: 'attemptId', type: String })
  getQuizAttemptDetail(
    @Req() req: AuthedRequest,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
  ) {
    return this.learnerService.getQuizAttemptDetail(req.user.userId, attemptId);
  }
}
