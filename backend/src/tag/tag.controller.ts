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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { AttachLessonTagsDto } from './dto/attach-lesson-tags.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Tags (Nhãn phân loại)')
@Controller()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post('tags')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tạo nhãn phân loại mới' })
  @ApiResponse({ status: 201, description: 'Tạo nhãn thành công' })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Lấy danh sách tất cả nhãn phân loại' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách nhãn có phân trang' })
  findAll(@Query() query: QueryTagDto) {
    return this.tagService.findAll(query);
  }

  @Get('tags/:id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết nhãn phân loại' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin chi tiết nhãn' })
  findOne(@Param('id') id: string) {
    return this.tagService.findOne(id);
  }

  @Patch('tags/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cập nhật nhãn phân loại' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete('tags/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xóa nhãn phân loại' })
  @ApiResponse({ status: 200, description: 'Xóa nhãn thành công' })
  remove(@Param('id') id: string) {
    return this.tagService.remove(id);
  }

  @Post('lessons/:id/tags')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Gán danh sách nhãn cho Bài học' })
  @ApiResponse({ status: 200, description: 'Gán nhãn cho bài học thành công' })
  attachTagsToLesson(
    @Param('id') lessonId: string,
    @Body() attachDto: AttachLessonTagsDto,
  ) {
    return this.tagService.attachTagsToLesson(lessonId, attachDto);
  }

  @Get('lessons/:id/tags')
  @ApiOperation({ summary: 'Lấy danh sách nhãn của Bài học' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách nhãn của bài học' })
  getLessonTags(@Param('id') lessonId: string) {
    return this.tagService.getLessonTags(lessonId);
  }
}
