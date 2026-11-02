import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('Blog & Discussion')
@Controller('posts')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({ status: 201, description: 'Bài viết được tạo thành công' })
  create(@Body() dto: CreatePostDto) {
    return this.blogService.createPost(dto.authorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài viết' })
  findAll(@Query() query: QueryPostDto) {
    return this.blogService.findAllPosts(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy bài viết theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findPostBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy bài viết theo ID' })
  findOne(@Param('id') id: string) {
    return this.blogService.findPostById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blogService.updatePost(id, dto);
  }

  @Patch(':id/submit-review')
  @ApiOperation({ summary: 'Gửi bài cho admin duyệt' })
  submitReview(@Param('id') id: string) {
    return this.blogService.submitForReview(id);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Admin duyệt hoặc từ chối bài' })
  review(@Param('id') id: string, @Body() dto: { status: 'PUBLISHED' | 'REJECTED'; reviewNote?: string; reviewerId: string }) {
    return this.blogService.reviewPost(id, dto.reviewerId, dto.status, dto.reviewNote);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like / unlike bài viết' })
  toggleLike(@Param('id') id: string, @Body() dto: { userId: string }) {
    return this.blogService.toggleLikePost(id, dto.userId);
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: 'Bookmark / bỏ bookmark bài viết' })
  toggleBookmark(@Param('id') id: string, @Body() dto: { userId: string }) {
    return this.blogService.toggleBookmarkPost(id, dto.userId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Lấy comment của bài viết' })
  getComments(@Param('id') postId: string) {
    return this.blogService.getComments(postId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Tạo comment hoặc reply cho bài viết' })
  createComment(@Param('id') postId: string, @Body() dto: CreateCommentDto & { authorId: string }) {
    return this.blogService.createComment(postId, dto.authorId, dto);
  }

  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Chỉnh sửa comment của người tạo' })
  updateComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: { authorId: string; content: string },
  ) {
    return this.blogService.updateComment(postId, commentId, dto.authorId, dto);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Xóa mềm comment' })
  deleteComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: { authorId: string },
  ) {
    return this.blogService.deleteComment(postId, commentId, dto.authorId);
  }

  @Post(':id/comments/:commentId/like')
  @ApiOperation({ summary: 'Like / unlike comment' })
  toggleCommentLike(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: { userId: string },
  ) {
    return this.blogService.toggleCommentLike(postId, commentId, dto.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm bài viết' })
  remove(@Param('id') id: string) {
    return this.blogService.removePost(id);
  }
}
