import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublicContentService } from './public-content.service';
import { PublicArticleCatalogService } from './public-article-catalog.service';
import {
  ARTICLE_CATALOG_LIMITS,
  PublicArticleCatalogQueryDto,
  PublicArticleCatalogResponseDto,
} from './dto/public-article-catalog.dto';
import { PublicQuizQueryDto } from './dto/public-quiz-query.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import type { AuthenticatedRequest } from '../common/access/roles.guard';

/** API công khai (không cần đăng nhập) — chỉ trả nội dung đã xuất bản. */
@ApiTags('Public Content (Trang công khai)')
@Controller('public')
export class PublicContentController {
  constructor(
    private readonly service: PublicContentService,
    private readonly catalogService: PublicArticleCatalogService,
  ) {}

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
  @ApiQuery({
    name: 'topicIds',
    required: false,
    description: 'Danh sách topicId phân tách dấu phẩy',
  })
  @ApiQuery({
    name: 'ids',
    required: false,
    description: 'Danh sách ID bài viết phân tách dấu phẩy',
  })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getArticles(
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
    @Query('topicIds') topicIds?: string,
    @Query('ids') ids?: string,
    @Query('featured') featured?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const parsedTopicIds = topicIds
      ? topicIds
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, ARTICLE_CATALOG_LIMITS.MAX_CSV_VALUES)
      : undefined;
    const parsedIds = ids
      ? ids
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
          .slice(0, ARTICLE_CATALOG_LIMITS.MAX_ARTICLE_IDS_LOOKUP)
      : undefined;
    const maxLimit = parsedIds?.length
      ? ARTICLE_CATALOG_LIMITS.MAX_ARTICLE_IDS_LOOKUP
      : parsedTopicIds?.length
        ? 1500
        : 200;
    return this.service.getArticles({
      category,
      tag,
      q,
      topicIds: parsedTopicIds,
      ids: parsedIds,
      featured: featured === 'true',
      limit: limit ? Math.min(limit, maxLimit) : undefined,
    });
  }

  @Get('articles/catalog')
  @ApiOperation({
    summary:
      'Thư viện bài viết phân trang từ Server kèm thống kê số lượng thật theo Chuyên mục, Chủ đề & Thẻ',
  })
  getArticleCatalog(
    @Query() query: PublicArticleCatalogQueryDto,
  ): Promise<PublicArticleCatalogResponseDto> {
    return this.catalogService.queryCatalog(query);
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

  @Get('tags')
  @ApiOperation({ summary: 'Tag có bài viết đã xuất bản' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTags(
    @Query('q') q?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.service.getTags({
      q,
      limit: limit ? Math.min(limit, 100) : undefined,
    });
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Thư viện bài học đã xuất bản' })
  getLessons() {
    return this.service.getLibraryLessons();
  }

  @Get('topics')
  @ApiOperation({
    summary: 'Toàn bộ cây Chủ đề đã xuất bản (phẳng, FE tự ráp qua parentId)',
  })
  getTopics() {
    return this.service.getTopics();
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
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Nộp bài khảo thí / luyện tập',
    description:
      'Khách vẫn nộp được; nếu có token thì lượt làm gắn với tài khoản.',
  })
  submitQuiz(
    @Param('id') quizId: string,
    @Body() dto: SubmitQuizAttemptDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.submitQuizAttempt(quizId, dto, req.user?.userId);
  }
}
