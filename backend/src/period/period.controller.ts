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
import { PeriodService } from './period.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { QueryPeriodDto } from './dto/query-period.dto';
import { PeriodResponseDto } from './dto/period-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Periods - Giai đoạn Lịch sử')
@Controller('periods')
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một giai đoạn lịch sử',
    description: 'Yêu cầu quyền quản trị (Admin). Thêm mới một Period vào hệ thống.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo giai đoạn lịch sử thành công',
    type: PeriodResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ (ví dụ: endYear < startYear)' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Chưa xác thực hoặc token không hợp lệ' })
  async create(@Body() createPeriodDto: CreatePeriodDto) {
    return this.periodService.create(createPeriodDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các giai đoạn lịch sử',
    description: 'Hỗ trợ phân trang, tìm kiếm theo từ khóa, lọc theo trạng thái và khu vực/tỉnh thành.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách thành công',
  })
  async findAll(@Query() query: QueryPeriodDto) {
    return this.periodService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một giai đoạn lịch sử theo ID',
    description: 'Trả về thông tin chi tiết của một Period cụ thể.',
  })
  @ApiParam({ name: 'id', description: 'UUID của giai đoạn', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy giai đoạn',
    type: PeriodResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy giai đoạn với ID này' })
  async findOne(@Param('id') id: string) {
    return this.periodService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin một giai đoạn lịch sử',
    description: 'Yêu cầu quyền quản trị (Admin). Cập nhật một hoặc nhiều thuộc tính của Period.',
  })
  @ApiParam({ name: 'id', description: 'UUID của giai đoạn cần sửa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: PeriodResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy giai đoạn' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu cập nhật không hợp lệ' })
  async update(
    @Param('id') id: string,
    @Body() updatePeriodDto: UpdatePeriodDto,
  ) {
    return this.periodService.update(id, updatePeriodDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa một giai đoạn lịch sử',
    description: 'Yêu cầu quyền quản trị (Admin). Xóa giai đoạn khỏi hệ thống.',
  })
  @ApiParam({ name: 'id', description: 'UUID của giai đoạn cần xóa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa giai đoạn thành công',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy giai đoạn' })
  async remove(@Param('id') id: string) {
    return this.periodService.remove(id);
  }
}
