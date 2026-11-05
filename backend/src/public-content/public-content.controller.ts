import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PublicContentService } from './public-content.service';

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
  @ApiOperation({ summary: 'Chuyên mục + bài viết (gồm cả chuyên mục con trực tiếp)' })
  getCategory(@Param('slug') slug: string) {
    return this.service.getCategoryBySlug(slug);
  }

  @Get('articles')
  @ApiOperation({ summary: 'Danh sách bài viết (lọc chuyên mục / tag / từ khoá / nổi bật)' })
  @ApiQuery({ name: 'category', required: false, description: 'slug chuyên mục' })
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
  @ApiOperation({ summary: 'Chi tiết bài viết + bài liên quan + bài trước/sau + dòng thời gian chứa bài' })
  getArticle(@Param('slug') slug: string) {
    return this.service.getArticleBySlug(slug);
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
}
