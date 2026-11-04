import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { HistoricalReferenceService } from './historical-reference.service';
import { CreateHistoricalReferenceDto } from './dto/create-reference.dto';
import { UpdateHistoricalReferenceDto } from './dto/update-reference.dto';
import { QueryHistoricalReferenceDto } from './dto/query-reference.dto';
import { RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';

@ApiTags('Historical References - Thư viện Nguồn & Tài liệu Tham khảo')
@Controller('historical-references')
export class HistoricalReferenceController {
  constructor(
    private readonly referenceService: HistoricalReferenceService,
  ) {}

  @Post()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary: 'Thêm mới một tài liệu tham khảo nguồn (Sách, Văn bia, Nghiên cứu...)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo tài liệu tham khảo thành công',
  })
  async create(@Body() dto: CreateHistoricalReferenceDto) {
    return this.referenceService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Tìm kiếm danh mục tài liệu tham khảo',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách tài liệu tham khảo thành công',
  })
  async findMany(@Query() query: QueryHistoricalReferenceDto) {
    return this.referenceService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một tài liệu tham khảo kèm danh sách phát biểu trích dẫn nó',
  })
  @ApiParam({ name: 'id', description: 'ID tài liệu tham khảo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy chi tiết thành công',
  })
  async findOne(@Param('id') id: string) {
    return this.referenceService.findOne(id);
  }

  @Patch(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({
    summary: 'Cập nhật thông tin tài liệu tham khảo',
  })
  @ApiParam({ name: 'id', description: 'ID tài liệu tham khảo' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHistoricalReferenceDto,
  ) {
    return this.referenceService.update(id, dto);
  }

  @Delete(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xoá tài liệu tham khảo',
  })
  @ApiParam({ name: 'id', description: 'ID tài liệu tham khảo' })
  async remove(@Param('id') id: string) {
    return this.referenceService.remove(id);
  }
}
