import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentWrite } from '../common/access/access.decorator';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('Categories (Chuyên mục bài viết)')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách chuyên mục (kèm số bài viết)' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết chuyên mục' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @ContentWrite()
  @ApiOperation({ summary: 'Tạo chuyên mục' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  @ContentWrite()
  @ApiOperation({ summary: 'Cập nhật chuyên mục' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @ContentWrite()
  @ApiOperation({ summary: 'Xoá chuyên mục (chỉ khi không còn bài viết)' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
