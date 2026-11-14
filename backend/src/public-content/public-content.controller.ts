import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublicContentService } from './public-content.service';
import { PublicQuizQueryDto } from './dto/public-quiz-query.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

/** API công khai (không cần đăng nhập) — chỉ trả nội dung đã xuất bản. */
@ApiTags('Public Content (Trang công khai)')
@Controller('public')
export class PublicContentController {
  constructor(private readonly service: PublicContentService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Chuyên mục kèm số bài đã xuất bản' })
  getCategories() {
    return this.service.getCategories();
  }

  @Get('categories/:slug')
  @ApiOperation({
    summary: 'Chuyên mục + bài viết (gồm cả chuyên mục con trực tiếp)',
  })
  getCategory(@Param('slug') slug: string) {
    return this.service.getCategoryBySlug(slug);
  }

  @Get('articles')
  @ApiOperation({
    summary: 'Danh sách bài viết (lọc chuyên mục / tag / từ khoá / nổi bật)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'slug chuyên mục',
  })
  @ApiQuery({ name: 'tag', required: false, description: 'id tag' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getArticles(
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
    @Query('featured') featured?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.service.getArticles({
      category,
      tag,
      q,
      featured: featured === 'true',
      limit: limit ? Math.min(limit, 200) : undefined,
    });
  }

  @Get('articles/:slug')
  @ApiOperation({
    summary:
      'Chi tiết bài viết + bài liên quan + bài trước/sau + dòng thời gian chứa bài',
  })
  getArticle(@Param('slug') slug: string) {
    return this.service.getArticleBySlug(slug);
  }

  @Get('blog')
  @ApiOperation({ summary: 'Danh sách blog đã xuất bản' })
  getBlogPosts() {
    return this.service.getBlogPosts();
  }

  @Get('blog/:slug')
  @ApiOperation({ summary: 'Chi tiết blog đã xuất bản' })
  getBlogPostBySlug(@Param('slug') slug: string) {
    return this.service.getBlogPostBySlug(slug);
  }

  @Get('timelines')
  @ApiOperation({ summary: 'Mọi dòng thời gian đã xuất bản kèm mốc' })
  getTimelines() {
    return this.service.getTimelines();
  }

  @Get('timelines/:slug')
  @ApiOperation({ summary: 'Một dòng thời gian kèm mốc' })
  getTimeline(@Param('slug') slug: string) {
    return this.service.getTimelineBySlug(slug);
  }

  @Get('periods')
  @ApiOperation({ summary: 'Danh sách giai đoạn / timeline được công khai' })
  getPeriods() {
    return this.service.getPeriods();
  }

  @Get('periods/:slug')
  @ApiOperation({ summary: 'Chi tiết giai đoạn / timeline công khai' })
  getPeriodBySlug(@Param('slug') slug: string) {
    return this.service.getPeriodBySlug(slug);
  }

  @Get('events')
  @ApiOperation({ summary: 'Danh sách sự kiện lịch sử đã xuất bản' })
  getEvents() {
    return this.service.getEvents();
  }

  @Get('events/:slug')
  @ApiOperation({ summary: 'Chi tiết sự kiện lịch sử đã xuất bản' })
  getEventBySlug(@Param('slug') slug: string) {
    return this.service.getEventBySlug(slug);
  }

  @Get('figures')
  @ApiOperation({ summary: 'Danh sách nhân vật lịch sử đã xuất bản' })
  getFigures() {
    return this.service.getFigureDirectory();
  }

  @Get('figures/directory')
  @ApiOperation({ summary: 'Danh mục nhân vật lịch sử công khai' })
  getFigureDirectory() {
    return this.service.getFigureDirectory();
  }

  @Get('figures/:slug')
  @ApiOperation({ summary: 'Chi tiết nhân vật lịch sử đã xuất bản' })
  getFigureBySlug(@Param('slug') slug: string) {
    return this.service.getFigureBySlug(slug);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Danh sách di tích / địa danh lịch sử đã xuất bản' })
  getLocations() {
    return this.service.getLocations();
  }

  @Get('locations/:slug')
  @ApiOperation({ summary: 'Chi tiết di tích / địa danh lịch sử đã xuất bản' })
  getLocationBySlug(@Param('slug') slug: string) {
    return this.service.getLocationBySlug(slug);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Tag có bài viết đã xuất bản' })
  getTags() {
    return this.service.getTags();
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Thư viện bài học đã xuất bản' })
  getLessons() {
    return this.service.getLibraryLessons();
  }

  @Get('topics/:slug')
  @ApiOperation({ summary: 'Chủ đề + chủ đề con đã xuất bản' })
  getTopic(@Param('slug') slug: string) {
    return this.service.getTopicBySlug(slug);
  }

  @Get('quizzes')
  @ApiOperation({
    summary:
      'Đề luyện tập theo chủ đề (đề có câu hỏi, thuộc chủ đề đã xuất bản)',
  })
  listQuizzes(@Query() query: PublicQuizQueryDto) {
    return this.service.listPracticeQuizzes(query);
  }

  @Post('quizzes/:id/submit')
  @ApiOperation({ summary: 'Nộp bài khảo thí / luyện tập' })
  submitQuiz(@Param('id') quizId: string, @Body() dto: SubmitQuizAttemptDto) {
    return this.service.submitQuizAttempt(quizId, dto);
  }

  @Get('quizzes/:id/statistics')
  @ApiOperation({
    summary: 'Thống kê kết quả & danh sách thí sinh nộp bài của đề thi',
  })
  getQuizStatistics(@Param('id') quizId: string) {
    return this.service.getQuizStatistics(quizId);
  }
}
