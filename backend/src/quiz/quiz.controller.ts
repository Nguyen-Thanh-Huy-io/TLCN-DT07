import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { UpsertQuizDto } from './dto/upsert-quiz.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { ContentWrite, RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';

/**
 * Đề ôn tập cuối bài học — nested dưới Lesson vì quan hệ 1-1, CMS luôn đọc/ghi theo
 * đúng 1 bài học cụ thể (không có nhu cầu liệt kê toàn bộ Quiz độc lập).
 */
@ApiTags('Quizzes - Đề ôn tập cuối bài')
@Controller('lessons/:lessonId/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary: 'Lấy đề ôn tập của 1 bài học',
    description: 'Trả về `null` nếu bài học này chưa có đề ôn tập (không phải lỗi).',
  })
  @ApiParam({ name: 'lessonId', description: 'UUID bài học', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: QuizResponseDto })
  async findOne(@Param('lessonId') lessonId: string) {
    return this.quizService.findByLessonId(lessonId);
  }

  @Put()
  @ContentWrite({ model: 'lesson', idParam: 'lessonId' })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới hoặc cập nhật nguyên đề ôn tập của 1 bài học',
    description:
      'Gửi lên toàn bộ danh sách câu hỏi mỗi lần lưu (giống cách Block Builder lưu nguyên mảng khối nội dung). Tạo mới nếu bài học chưa có đề, cập nhật nếu đã có.',
  })
  @ApiParam({ name: 'lessonId', description: 'UUID bài học', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lưu đề ôn tập thành công', type: QuizResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Câu hỏi không hợp lệ (xem message chi tiết)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy bài học' })
  async upsert(@Param('lessonId') lessonId: string, @Body() dto: UpsertQuizDto) {
    return this.quizService.upsert(lessonId, dto);
  }

  @Delete()
  @ContentWrite({ model: 'lesson', idParam: 'lessonId' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa đề ôn tập của 1 bài học' })
  @ApiParam({ name: 'lessonId', description: 'UUID bài học', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Xóa thành công' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Bài học chưa có đề ôn tập' })
  async remove(@Param('lessonId') lessonId: string) {
    return this.quizService.remove(lessonId);
  }
}
