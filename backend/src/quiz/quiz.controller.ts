import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { ReviewQuizDto } from './dto/review-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { AttemptResultDto } from './dto/attempt-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

interface AuthenticatedRequest {
  user?: {
    userId?: string;
    id?: string;
    role?: string;
  };
}

@ApiTags('Quizzes - Bài kiểm tra Trắc nghiệm Lịch sử')
@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một bài kiểm tra Quiz',
    description:
      'Yêu cầu đăng nhập. Tạo bài kiểm tra mới kèm danh sách câu hỏi & đáp án.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo bài kiểm tra thành công',
    type: QuizResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu câu hỏi hoặc đáp án không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'LessonId hoặc TopicId không tồn tại',
  })
  async create(
    @Body() createQuizDto: CreateQuizDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const userId = req.user?.userId || req.user?.id || '';
    return this.quizService.create(createQuizDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các bài kiểm tra',
    description:
      'Hỗ trợ phân trang, lọc theo topicId, lessonId, status và tìm kiếm từ khóa.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách bài kiểm tra thành công',
  })
  async findAll(@Query() query: QueryQuizDto) {
    return this.quizService.findAll(query);
  }

  @Get('user/attempts')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy lịch sử làm bài kiểm tra của người dùng hiện tại',
    description:
      'Yêu cầu đăng nhập. Trả về danh sách các lần làm bài và điểm số.',
  })
  @ApiQuery({
    name: 'quizId',
    required: false,
    description: 'Lọc lịch sử theo Quiz ID cụ thể',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy lịch sử làm bài thành công',
  })
  async getUserAttempts(
    @Req() req: AuthenticatedRequest,
    @Query('quizId') quizId?: string,
  ): Promise<any> {
    const userId = req.user?.userId || req.user?.id || '';
    return this.quizService.getUserAttempts(userId, quizId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một bài kiểm tra theo ID',
    description: 'Trả về thông tin Quiz và các câu hỏi.',
  })
  @ApiParam({ name: 'id', description: 'UUID của Quiz', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy bài kiểm tra',
    type: QuizResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy bài kiểm tra',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const isAuthorOrAdmin =
      req.user?.role === 'ADMIN' || req.user?.role === 'SUPERADMIN';
    return this.quizService.findOne(id, isAuthorOrAdmin);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin bài kiểm tra',
    description: 'Yêu cầu đăng nhập. Cập nhật thuộc tính của Quiz.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của bài kiểm tra cần sửa',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: QuizResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy bài kiểm tra',
  })
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ): Promise<any> {
    return this.quizService.update(id, updateQuizDto);
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Duyệt hoặc Từ chối bài kiểm tra (Admin / Reviewer)',
    description:
      'Yêu cầu quyền Admin. Chuyển trạng thái sang PUBLISHED hoặc REJECTED.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của bài kiểm tra cần duyệt',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kiểm duyệt bài kiểm tra thành công',
    type: QuizResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Thiếu lý do từ chối khi REJECTED',
  })
  async review(
    @Param('id') id: string,
    @Body() reviewQuizDto: ReviewQuizDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const adminUserId = req.user?.userId || req.user?.id || '';
    return this.quizService.review(id, reviewQuizDto, adminUserId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa một bài kiểm tra',
    description: 'Yêu cầu đăng nhập. Xóa Quiz và toàn bộ câu hỏi liên quan.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của bài kiểm tra cần xóa',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa bài kiểm tra thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy bài kiểm tra',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.quizService.remove(id);
  }

  @Post(':id/attempts')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bắt đầu làm bài kiểm tra (Start Attempt)',
    description:
      'Yêu cầu đăng nhập. Khởi tạo một lượt làm bài mới và nhận danh sách câu hỏi làm bài (đã ẩn đáp án đúng).',
  })
  @ApiParam({ name: 'id', description: 'UUID của bài kiểm tra', type: String })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bắt đầu lượt làm bài thành công',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Bài kiểm tra chưa được xuất bản',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Đã vượt quá số lần làm bài tối đa',
  })
  async startAttempt(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const userId = req.user?.userId || req.user?.id || '';
    return this.quizService.startAttempt(id, userId);
  }

  @Post('attempts/:attemptId/submit')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Nộp bài kiểm tra và chấm điểm tự động (Submit Attempt)',
    description:
      'Yêu cầu đăng nhập. Nộp câu trả lời, hệ thống chấm điểm và trả về kết quả chi tiết kèm XP thưởng.',
  })
  @ApiParam({
    name: 'attemptId',
    description: 'UUID của lượt làm bài',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nộp bài và chấm điểm thành công',
    type: AttemptResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lượt làm bài đã kết thúc hoặc quá thời gian quy định',
  })
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() submitAttemptDto: SubmitAttemptDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AttemptResultDto> {
    const userId = req.user?.userId || req.user?.id || '';
    return this.quizService.submitAttempt(attemptId, userId, submitAttemptDto);
  }
}
