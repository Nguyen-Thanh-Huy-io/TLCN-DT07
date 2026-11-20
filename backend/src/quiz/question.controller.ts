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
import { QuestionService } from './question.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from './dto/create-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';

@ApiTags('Questions - Ngân hàng câu hỏi tập trung')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Lấy danh sách câu hỏi trong Ngân hàng câu hỏi',
    description:
      'Hỗ trợ lọc theo loại câu hỏi (type), độ khó (difficulty), từ khóa (search) và phân trang.',
  })
  async findAll(@Query() query: QueryQuestionDto) {
    return this.questionService.findAll(query);
  }

  @Get(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết một câu hỏi theo ID' })
  @ApiParam({ name: 'id', description: 'UUID câu hỏi', type: String })
  async findOne(@Param('id') id: string) {
    return this.questionService.findOne(id);
  }

  @Post()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Thêm mới câu hỏi vào Ngân hàng câu hỏi',
    description:
      'Xác thực chặt chẽ cấu trúc đáp án theo loại câu hỏi (Single Choice, True/False, Multiple Choice, Ordering, Matching).',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo câu hỏi thành công',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu câu hỏi không hợp lệ',
  })
  async create(@Body() dto: CreateQuestionDto) {
    return this.questionService.create(dto);
  }

  @Put(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật câu hỏi trong Ngân hàng câu hỏi' })
  @ApiParam({ name: 'id', description: 'UUID câu hỏi', type: String })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionService.update(id, dto);
  }

  @Delete(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa câu hỏi khỏi Ngân hàng câu hỏi' })
  @ApiParam({ name: 'id', description: 'UUID câu hỏi', type: String })
  async remove(@Param('id') id: string) {
    return this.questionService.remove(id);
  }
}
