import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ContentWrite, RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';
import { currentUser } from '../common/access/roles.guard';
import { ArticleService } from './article.service';
import { CreateArticleDto, QueryArticleDto, ReviewArticleDto, UpdateArticleDto } from './dto/article.dto';

/** API CMS cho bài viết (mọi trạng thái). Trang công khai dùng /public/articles. */
@ApiTags('Articles (Bài viết)')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Danh sách bài viết (lọc chuyên mục / tag / trạng thái, phân trang)' })
  findAll(@Query() query: QueryArticleDto) {
    return this.articleService.findAll(query);
  }

  @Get(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Chi tiết bài viết (kèm nội dung khối, tag, dòng thời gian chứa bài)' })
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(id);
  }

  @Post()
  @ContentWrite({ model: 'article' })
  @ApiOperation({ summary: 'Tạo bài viết' })
  create(@Body() dto: CreateArticleDto, @Req() req: Request) {
    return this.articleService.create(dto, currentUser(req)?.userId);
  }

  @Patch(':id')
  @ContentWrite({ model: 'article', idParam: 'id', versioned: true })
  @ApiOperation({
    summary: 'Cập nhật bài viết',
    description: 'Bài đã xuất bản: biên tập viên sửa → thành bản sửa chờ duyệt (xem content-revisions).',
  })
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articleService.update(id, dto);
  }

  @Patch(':id/review')
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  @ApiOperation({
    summary: 'Duyệt hoặc Từ chối bài viết mới (Admin / Reviewer)',
    description: 'Chuyển trạng thái sang PUBLISHED hoặc REJECTED (kèm lý do). Áp dụng quy tắc 2 người: người duyệt khác người tạo.',
  })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewArticleDto,
    @Req() req: Request,
  ) {
    const reviewerUserId = currentUser(req)?.userId;
    return this.articleService.review(id, dto, reviewerUserId);
  }

  @Delete(':id')
  @ContentWrite({ model: 'article', idParam: 'id' })
  @ApiOperation({ summary: 'Xoá bài viết' })
  remove(@Param('id') id: string) {
    return this.articleService.remove(id);
  }
}
