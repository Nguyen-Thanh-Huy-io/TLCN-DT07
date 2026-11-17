import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import {
  QuizStatistics,
  QuizStatisticsService,
} from './quiz-statistics.service';
import {
  CreateStandaloneQuizDto,
  UpdateStandaloneQuizDto,
} from './dto/create-standalone-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';

const QUIZ_ID_PARAM = {
  name: 'id',
  description: 'UUID của đề Quiz',
  type: String,
};

@ApiTags('Quizzes - Quản lý bộ đề thi & ôn tập độc lập')
@Controller('quizzes')
export class StandaloneQuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly quizStatisticsService: QuizStatisticsService,
  ) {}

  @Get()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả các đề Quiz trong hệ thống',
    description:
      'Hỗ trợ tìm kiếm theo tiêu đề, lọc theo chuyên đề, bài học và phân trang.',
  })
  async findAll(@Query() query: QueryQuizDto) {
    return this.quizService.findAll(query);
  }

  @Get(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết một đề Quiz theo ID' })
  @ApiParam(QUIZ_ID_PARAM)
  async findOne(@Param('id') id: string) {
    return this.quizService.findById(id);
  }

  @Get(':id/statistics')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Thống kê kết quả đề: tổng lượt làm, tỷ lệ đúng từng câu',
  })
  @ApiParam(QUIZ_ID_PARAM)
  getStatistics(@Param('id') id: string): Promise<QuizStatistics> {
    return this.quizStatisticsService.getQuizStatistics(id);
  }

  @Post()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một đề Quiz độc lập',
    description:
      'Có thể tổng hợp câu hỏi từ Ngân hàng câu hỏi hoặc tạo mới trực tiếp trong đề.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo đề Quiz thành công',
  })
  async create(@Body() dto: CreateStandaloneQuizDto) {
    return this.quizService.createStandalone(dto);
  }

  @Put(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật đề Quiz độc lập theo ID' })
  @ApiParam(QUIZ_ID_PARAM)
  async update(@Param('id') id: string, @Body() dto: UpdateStandaloneQuizDto) {
    return this.quizService.updateStandalone(id, dto);
  }

  @Delete(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa đề Quiz theo ID' })
  @ApiParam(QUIZ_ID_PARAM)
  async remove(@Param('id') id: string) {
    return this.quizService.removeById(id);
  }
}
