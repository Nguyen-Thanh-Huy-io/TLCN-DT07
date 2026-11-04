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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateStandaloneQuizDto, UpdateStandaloneQuizDto } from './dto/create-standalone-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';

@ApiTags('Quizzes - Quản lý bộ đề thi & ôn tập độc lập')
@Controller('quizzes')
export class StandaloneQuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả các đề Quiz trong hệ thống',
    description: 'Hỗ trợ tìm kiếm theo tiêu đề, lọc theo chuyên đề, bài học và phân trang.',
  })
  async findAll(@Query() query: QueryQuizDto) {
    return this.quizService.findAll(query);
  }

  @Get(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết một đề Quiz theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của đề Quiz', type: String })
  async findOne(@Param('id') id: string) {
    return this.quizService.findById(id);
  }

  @Post()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một đề Quiz độc lập',
    description: 'Có thể tổng hợp câu hỏi từ Ngân hàng câu hỏi hoặc tạo mới trực tiếp trong đề.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Tạo đề Quiz thành công' })
  async create(@Body() dto: CreateStandaloneQuizDto) {
    return this.quizService.createStandalone(dto);
  }

  @Put(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật đề Quiz độc lập theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của đề Quiz', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateStandaloneQuizDto) {
    return this.quizService.updateStandalone(id, dto);
  }

  @Delete(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa đề Quiz theo ID' })
  @ApiParam({ name: 'id', description: 'UUID của đề Quiz', type: String })
  async remove(@Param('id') id: string) {
    return this.quizService.removeById(id);
  }
}
