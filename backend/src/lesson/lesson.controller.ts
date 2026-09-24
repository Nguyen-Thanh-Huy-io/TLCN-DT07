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
} from '@nestjs/swagger';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { QueryLessonDto } from './dto/query-lesson.dto';
import { ReviewLessonDto } from './dto/review-lesson.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Lessons - Bài học Lịch sử')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một bài học lịch sử',
    description: 'Yêu cầu đăng nhập. Tạo bài học mới ở trạng thái bản nháp DRAFT.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo bài học thành công',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TopicId không tồn tại' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Chưa xác thực token' })
  async create(@Body() createLessonDto: CreateLessonDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.lessonService.create(createLessonDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các bài học lịch sử',
    description: 'Hỗ trợ phân trang, lọc theo topicId, status, độ khó difficulty và từ khóa tìm kiếm.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách bài học thành công',
  })
  async findAll(@Query() query: QueryLessonDto) {
    return this.lessonService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một bài học lịch sử theo ID',
    description: 'Trả về chi tiết bài học kèm thời gian đọc ước tính (estimatedReadMinutes).',
  })
  @ApiParam({ name: 'id', description: 'UUID của bài học', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy bài học',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy bài học' })
  async findOne(@Param('id') id: string) {
    return this.lessonService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin bài học lịch sử',
    description: 'Yêu cầu đăng nhập. Cập nhật thuộc tính của Lesson.',
  })
  @ApiParam({ name: 'id', description: 'UUID của bài học cần sửa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy bài học hoặc TopicId mới' })
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonService.update(id, updateLessonDto);
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Duyệt hoặc Từ chối bài học (Admin / Reviewer)',
    description: 'Yêu cầu quyền Admin. Chuyển trạng thái sang PUBLISHED hoặc REJECTED (kèm lý do).',
  })
  @ApiParam({ name: 'id', description: 'UUID của bài học cần duyệt', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kiểm duyệt bài học thành công',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Thiếu lý do từ chối khi REJECTED' })
  async review(
    @Param('id') id: string,
    @Body() reviewLessonDto: ReviewLessonDto,
    @Req() req: any,
  ) {
    const adminUserId = req.user?.userId || req.user?.id;
    return this.lessonService.review(id, reviewLessonDto, adminUserId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa một bài học lịch sử',
    description: 'Yêu cầu đăng nhập. Xóa Lesson khỏi hệ thống.',
  })
  @ApiParam({ name: 'id', description: 'UUID của bài học cần xóa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa bài học thành công',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy bài học' })
  async remove(@Param('id') id: string) {
    return this.lessonService.remove(id);
  }
}
