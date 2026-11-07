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
import { BlogService } from './blog.service';

@Controller('posts')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

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
