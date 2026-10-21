import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LearningPathService } from './learning-path.service';
import {
  CreateLearningPathDto,
  UpdateLearningPathDto,
} from './dto/create-learning-path.dto';
import { CreateChapterDto, UpdateChapterDto } from './dto/create-chapter.dto';
import {
  AddLessonsToChapterDto,
  ReorderChapterLessonsDto,
} from './dto/chapter-lesson-action.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Learning Paths - Lộ trình học & Cấu trúc chương')
@Controller('learning-paths')
export class LearningPathController {
  constructor(private readonly service: LearningPathService) {}

  // ==========================================
  // 1. LEARNING PATH ROUTES
  // ==========================================

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các lộ trình học' })
  findAllPaths() {
    return this.service.findAllPaths();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một lộ trình học kèm các chương và bài học' })
  findPathById(@Param('id') id: string) {
    return this.service.findPathById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo lộ trình học mới' })
  createPath(@Body() dto: CreateLearningPathDto) {
    return this.service.createPath(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật lộ trình học' })
  updatePath(@Param('id') id: string, @Body() dto: UpdateLearningPathDto) {
    return this.service.updatePath(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa lộ trình học' })
  deletePath(@Param('id') id: string) {
    return this.service.deletePath(id);
  }

  // ==========================================
  // 2. CHAPTER ROUTES
  // ==========================================

  @Post('chapters')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo chương học mới trong lộ trình' })
  createChapter(@Body() dto: CreateChapterDto) {
    return this.service.createChapter(dto);
  }

  @Put('chapters/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật chương học' })
  updateChapter(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.service.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa chương học' })
  deleteChapter(@Param('id') id: string) {
    return this.service.deleteChapter(id);
  }

  // ==========================================
  // 3. CHAPTER LESSONS (GOM BÀI VÀ SẮP XẾP)
  // ==========================================

  @Post('chapters/:chapterId/lessons')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Gom bài học từ thư viện vào chương' })
  addLessonsToChapter(
    @Param('chapterId') chapterId: string,
    @Body() dto: AddLessonsToChapterDto,
  ) {
    return this.service.addLessonsToChapter(chapterId, dto.lessonIds);
  }

  @Delete('chapters/:chapterId/lessons/:lessonId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Gỡ bài học khỏi chương (giữ nguyên bài trong thư viện)' })
  removeLessonFromChapter(
    @Param('chapterId') chapterId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.service.removeLessonFromChapter(chapterId, lessonId);
  }

  @Put('chapters/:chapterId/lessons/reorder')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kéo thả sắp xếp lại thứ tự bài học trong chương' })
  reorderChapterLessons(
    @Param('chapterId') chapterId: string,
    @Body() dto: ReorderChapterLessonsDto,
  ) {
    return this.service.reorderChapterLessons(chapterId, dto);
  }
}
