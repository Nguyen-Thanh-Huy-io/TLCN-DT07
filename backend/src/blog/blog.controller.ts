import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateCommentDto, DeleteCommentDto, LikeCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CreateBlogPostDto, ReviewBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';
import { BlogService } from './blog.service';

@Controller('posts')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  listPosts() {
    return this.blogService.listPosts();
  }

  @Get(':slug')
  getPostBySlug(@Param('slug') slug: string) {
    return this.blogService.getPostBySlug(slug);
  }

  @Post()
  createPost(@Body() dto: CreateBlogPostDto) {
    return this.blogService.createPost(dto);
  }

  @Patch(':id/review')
  review(@Param('id') id: string, @Body() dto: ReviewBlogPostDto) {
    return this.blogService.reviewPost(id, dto);
  }

  @Patch(':id')
  updatePost(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.updatePost(id, dto);
  }

  @Delete(':id')
  deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }

  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.blogService.getComments(postId);
  }

  @Post(':id/comments')
  createComment(@Param('id') postId: string, @Body() dto: CreateCommentDto) {
    return this.blogService.createComment(postId, dto);
  }

  @Patch(':id/comments/:commentId')
  updateComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.blogService.updateComment(postId, commentId, dto.authorId, dto);
  }

  @Delete(':id/comments/:commentId')
  deleteComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: DeleteCommentDto,
  ) {
    return this.blogService.deleteComment(postId, commentId, dto.authorId);
  }

  @Post(':id/comments/:commentId/like')
  likeComment(
    @Param('id') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: LikeCommentDto,
  ) {
    return this.blogService.likeComment(postId, commentId, dto.userId);
  }
}
