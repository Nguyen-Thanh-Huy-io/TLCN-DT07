import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';
import { AuthGuard } from '../common/guards/auth.guard';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import {
  CreateCommentDto,
  DeleteCommentDto,
  LikeCommentDto,
  UpdateCommentDto,
} from './dto/comment.dto';
import {
  CreateBlogPostDto,
  ListBlogPostsQueryDto,
  ReviewBlogPostDto,
  UpdateBlogPostDto,
} from './dto/blog-post.dto';
import { ReportPostDto, UpdateCommunityProfileDto } from './dto/interact.dto';
import { BlogService } from './blog.service';

type AuthedRequest = Request & { user: { userId: string; role: string } };
type MaybeAuthedRequest = Request & { user?: { userId: string; role: string } };

@ApiTags('Blog / Community')
@Controller('posts')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ============================================================
  // Post CRUD
  // ============================================================

  @ApiOperation({
    summary:
      'Danh sách bài viết cộng đồng (lọc theo type, sort=trending, cursor; kèm likedByMe/bookmarkedByMe)',
  })
  @Get()
  @UseGuards(OptionalAuthGuard)
  listPosts(
    @Query() query: ListBlogPostsQueryDto,
    @Req() req: MaybeAuthedRequest,
  ) {
    return this.blogService.listPosts(req.user?.userId, query);
  }

  @ApiOperation({ summary: 'Bài viết tôi đã lưu' })
  @ApiBearerAuth('JWT-auth')
  @Get('bookmarks/me')
  @UseGuards(AuthGuard)
  listMyBookmarks(@Req() req: AuthedRequest) {
    return this.blogService.listMyBookmarks(req.user.userId);
  }

  // ============================================================
  // Community Member Profile & Follow Endpoints
  // ============================================================

  @ApiOperation({
    summary: 'Danh sách thành viên tiêu biểu / gợi ý theo dõi trên Cộng đồng',
  })
  @Get('users/suggested')
  @UseGuards(OptionalAuthGuard)
  getSuggestedMembers(
    @Query('limit') limit: string | undefined,
    @Req() req: MaybeAuthedRequest,
  ) {
    return this.blogService.getSuggestedMembers(
      req.user?.userId,
      limit ? Number(limit) : 6,
    );
  }

  @ApiOperation({ summary: 'Hồ sơ tài khoản Cộng đồng của chính tôi' })
  @ApiBearerAuth('JWT-auth')
  @Get('users/me/profile')
  @UseGuards(AuthGuard)
  getMyCommunityProfile(@Req() req: AuthedRequest) {
    return this.blogService.getCommunityProfile(
      req.user.userId,
      req.user.userId,
    );
  }

  @ApiOperation({
    summary: 'Cập nhật hồ sơ Cộng đồng cá nhân (bio, họ tên, avatar)',
  })
  @ApiBearerAuth('JWT-auth')
  @Patch('users/me/profile')
  @UseGuards(AuthGuard)
  updateMyCommunityProfile(
    @Req() req: AuthedRequest,
    @Body() dto: UpdateCommunityProfileDto,
  ) {
    return this.blogService.updateMyCommunityProfile(req.user.userId, dto);
  }

  @ApiOperation({
    summary:
      'Hồ sơ tài khoản Cộng đồng của một thành viên (theo username hoặc ID)',
  })
  @Get('users/:identifier/profile')
  @UseGuards(OptionalAuthGuard)
  getCommunityProfile(
    @Param('identifier') identifier: string,
    @Req() req: MaybeAuthedRequest,
  ) {
    return this.blogService.getCommunityProfile(identifier, req.user?.userId);
  }

  @ApiOperation({
    summary: 'Toggle theo dõi / bỏ theo dõi thành viên trên Cộng đồng',
  })
  @ApiBearerAuth('JWT-auth')
  @Post('users/:identifier/follow')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleFollow(
    @Param('identifier') identifier: string,
    @Req() req: AuthedRequest,
  ) {
    return this.blogService.toggleFollow(req.user.userId, identifier);
  }

  @ApiOperation({ summary: 'Chi tiết bài viết theo slug' })
  @Get(':slug')
  @UseGuards(OptionalAuthGuard)
  getPostBySlug(@Param('slug') slug: string, @Req() req: MaybeAuthedRequest) {
    return this.blogService.getPostBySlug(slug, req.user?.userId);
  }

  @ApiOperation({ summary: 'Tạo bài viết mới (QUICK_POST hoặc LONG_FORM)' })
  @Post()
  @UseGuards(OptionalAuthGuard)
  createPost(@Body() dto: CreateBlogPostDto, @Req() req: MaybeAuthedRequest) {
    return this.blogService.createPost({
      ...dto,
      authorId: req.user?.userId ?? dto.authorId,
    });
  }

  @ApiOperation({ summary: 'Duyệt / từ chối bài viết (Admin/Superadmin)' })
  @Patch(':id/review')
  @RequireRoles(...ROLE_GROUPS.REVIEWERS)
  review(@Param('id') id: string, @Body() dto: ReviewBlogPostDto) {
    return this.blogService.reviewPost(id, dto);
  }

  @ApiOperation({ summary: 'Cập nhật bài viết (tác giả hoặc biên tập viên)' })
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @UseGuards(AuthGuard)
  updatePost(
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
    @Req() req: AuthedRequest,
  ) {
    return this.blogService.updatePost(id, dto, req.user.userId, req.user.role);
  }

  @ApiOperation({ summary: 'Xóa bài viết (tác giả hoặc biên tập viên)' })
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @UseGuards(AuthGuard)
  deletePost(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.blogService.deletePost(id, req.user.userId, req.user.role);
  }

  // ============================================================
  // Community Interaction Endpoints
  // ============================================================

  @ApiOperation({ summary: 'Toggle like bài viết (like/un-like)' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/like')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleLike(@Param('id') postId: string, @Req() req: AuthedRequest) {
    return this.blogService.toggleLike(postId, req.user.userId);
  }

  @ApiOperation({ summary: 'Toggle bookmark bài viết (lưu/bỏ lưu)' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/bookmark')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleBookmark(@Param('id') postId: string, @Req() req: AuthedRequest) {
    return this.blogService.toggleBookmark(postId, req.user.userId);
  }

  @ApiOperation({ summary: 'Báo cáo vi phạm bài viết (mỗi user 1 lần/bài)' })
  @ApiBearerAuth('JWT-auth')
  @Post(':id/report')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  reportPost(
    @Param('id') postId: string,
    @Req() req: AuthedRequest,
    @Body() dto: ReportPostDto,
  ) {
    return this.blogService.reportPost(postId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Tăng view count (chống trùng 1 giờ theo user/IP)' })
  @Patch(':id/view')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementView(
    @Param('id') postId: string,
    @Req() req: MaybeAuthedRequest,
  ) {
    const viewerKey = req.user?.userId
      ? `u:${req.user.userId}`
      : `ip:${req.ip ?? 'unknown'}`;
    await this.blogService.incrementViewCount(postId, viewerKey);
  }

  // ============================================================
  // Comments
  // ============================================================

  @ApiOperation({ summary: 'Lấy danh sách bình luận của bài viết' })
  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.blogService.getComments(postId);
  }

  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @Post(':id/comments')
  createComment(@Param('id') postId: string, @Body() dto: CreateCommentDto) {
    return this.blogService.createComment(postId, dto);
  }

  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @Patch(':id/comments/:commentId')
  updateComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.blogService.updateComment(postId, commentId, dto.authorId, dto);
  }

  @ApiOperation({ summary: 'Xóa bình luận (soft delete)' })
  @Delete(':id/comments/:commentId')
  deleteComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: DeleteCommentDto,
  ) {
    return this.blogService.deleteComment(postId, commentId, dto.authorId);
  }

  @ApiOperation({ summary: 'Like bình luận' })
  @Post(':id/comments/:commentId/like')
  likeComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: LikeCommentDto,
  ) {
    return this.blogService.likeComment(postId, commentId, dto.userId);
  }
}
