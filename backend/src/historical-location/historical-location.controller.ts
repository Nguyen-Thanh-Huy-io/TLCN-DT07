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
import { HistoricalLocationService } from './historical-location.service';
import { CreateHistoricalLocationDto } from './dto/create-historical-location.dto';
import { UpdateHistoricalLocationDto } from './dto/update-historical-location.dto';
import { QueryHistoricalLocationDto } from './dto/query-historical-location.dto';
import { HistoricalLocationResponseDto } from './dto/historical-location-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import {
  HISTORICAL_LOCATION_ERROR_MESSAGES,
  HISTORICAL_LOCATION_SUCCESS_MESSAGES,
} from './constants/historical-location.constant';

@ApiTags('Historical Locations - Địa điểm / Di tích Lịch sử')
@Controller('historical-locations')
export class HistoricalLocationController {
  constructor(
    private readonly locationService: HistoricalLocationService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một địa điểm / di tích lịch sử',
    description:
      'Yêu cầu đăng nhập quản trị viên. Dùng cho CMS Lịch sử để quản lý di tích, chiến trường, tọa độ GPS, bán kính khuôn viên.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: HISTORICAL_LOCATION_SUCCESS_MESSAGES.CREATED,
    type: HistoricalLocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: HISTORICAL_LOCATION_ERROR_MESSAGES.INVALID_COORDINATES,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa xác thực token',
  })
  async create(@Body() dto: CreateHistoricalLocationDto) {
    return this.locationService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các địa điểm lịch sử',
    description:
      'Hỗ trợ phân trang, lọc theo type (HISTORICAL_SITE, BATTLEFIELD...), provinceCity và từ khóa tìm kiếm.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách địa điểm thành công',
  })
  async findAll(@Query() query: QueryHistoricalLocationDto) {
    return this.locationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một địa điểm lịch sử theo ID',
    description: 'Trả về thông tin chi tiết địa điểm kèm các bài học lịch sử liên quan.',
  })
  @ApiParam({ name: 'id', description: 'UUID của địa điểm lịch sử', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy địa điểm',
    type: HistoricalLocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: HISTORICAL_LOCATION_ERROR_MESSAGES.LOCATION_NOT_FOUND,
  })
  async findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin một địa điểm lịch sử',
    description: 'Yêu cầu đăng nhập quản trị viên. Cập nhật thông tin địa danh, tọa độ, bán kính.',
  })
  @ApiParam({ name: 'id', description: 'UUID của địa điểm cần sửa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: HISTORICAL_LOCATION_SUCCESS_MESSAGES.UPDATED,
    type: HistoricalLocationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: HISTORICAL_LOCATION_ERROR_MESSAGES.LOCATION_NOT_FOUND,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHistoricalLocationDto,
  ) {
    return this.locationService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa một địa điểm lịch sử',
    description: 'Yêu cầu đăng nhập quản trị viên. Xóa địa điểm khỏi hệ thống.',
  })
  @ApiParam({ name: 'id', description: 'UUID của địa điểm cần xóa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: HISTORICAL_LOCATION_SUCCESS_MESSAGES.DELETED,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: HISTORICAL_LOCATION_ERROR_MESSAGES.LOCATION_NOT_FOUND,
  })
  async remove(@Param('id') id: string) {
    return this.locationService.remove(id);
  }
}
