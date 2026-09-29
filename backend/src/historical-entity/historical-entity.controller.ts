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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { HistoricalEntityService } from './historical-entity.service';
import { CreateHistoricalEntityDto } from './dto/create-historical-entity.dto';
import { UpdateHistoricalEntityDto } from './dto/update-historical-entity.dto';
import { QueryHistoricalEntityDto } from './dto/query-historical-entity.dto';
import { HistoricalEntityResponseDto } from './dto/historical-entity-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import {
  HISTORICAL_ENTITY_ERROR_MESSAGES,
  HISTORICAL_ENTITY_SUCCESS_MESSAGES,
} from './constants/historical-entity.constant';

@ApiTags('Historical Entities - Thực thể / Nhân vật Lịch sử')
@Controller('historical-entities')
export class HistoricalEntityController {
  constructor(
    private readonly entityService: HistoricalEntityService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một thực thể lịch sử',
    description:
      'Yêu cầu đăng nhập quản trị viên. Dùng cho CMS Lịch sử để quản lý nhân vật, triều đại, tổ chức chính trị, liên minh, cộng đồng.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: HISTORICAL_ENTITY_SUCCESS_MESSAGES.CREATED,
    type: HistoricalEntityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: HISTORICAL_ENTITY_ERROR_MESSAGES.INVALID_YEAR_RANGE,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa xác thực token',
  })
  async create(@Body() dto: CreateHistoricalEntityDto) {
    return this.entityService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các thực thể lịch sử',
    description:
      'Hỗ trợ phân trang, lọc theo type (PERSON, POLITY_STATE...), quốc tịch / xuất xứ, năm hoạt động và từ khóa tìm kiếm.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách thực thể thành công',
  })
  async findAll(@Query() query: QueryHistoricalEntityDto) {
    return this.entityService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một thực thể lịch sử theo ID',
    description: 'Trả về thông tin chi tiết thực thể kèm các bài học lịch sử liên quan.',
  })
  @ApiParam({ name: 'id', description: 'UUID của thực thể lịch sử', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy thực thể',
    type: HistoricalEntityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: HISTORICAL_ENTITY_ERROR_MESSAGES.ENTITY_NOT_FOUND,
  })
  async findOne(@Param('id') id: string) {
    return this.entityService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin một thực thể lịch sử',
    description: 'Yêu cầu đăng nhập quản trị viên. Cập nhật thông tin nhân vật, niên đại, mô tả.',
  })
  @ApiParam({ name: 'id', description: 'UUID của thực thể cần sửa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: HISTORICAL_ENTITY_SUCCESS_MESSAGES.UPDATED,
    type: HistoricalEntityResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: HISTORICAL_ENTITY_ERROR_MESSAGES.ENTITY_NOT_FOUND,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHistoricalEntityDto,
  ) {
    return this.entityService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa một thực thể lịch sử',
    description: 'Yêu cầu đăng nhập quản trị viên. Xóa thực thể khỏi hệ thống.',
  })
  @ApiParam({ name: 'id', description: 'UUID của thực thể cần xóa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: HISTORICAL_ENTITY_SUCCESS_MESSAGES.DELETED,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: HISTORICAL_ENTITY_ERROR_MESSAGES.ENTITY_NOT_FOUND,
  })
  async remove(@Param('id') id: string) {
    return this.entityService.remove(id);
  }
}
