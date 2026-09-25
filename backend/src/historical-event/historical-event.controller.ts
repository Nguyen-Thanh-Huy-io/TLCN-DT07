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
import { HistoricalEventService } from './historical-event.service';
import { CreateHistoricalEventDto } from './dto/create-historical-event.dto';
import { UpdateHistoricalEventDto } from './dto/update-historical-event.dto';
import { QueryHistoricalEventDto } from './dto/query-historical-event.dto';
import { HistoricalEventResponseDto } from './dto/historical-event-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Historical Events - Sự kiện Lịch sử')
@Controller('historical-events')
export class HistoricalEventController {
  constructor(
    private readonly historicalEventService: HistoricalEventService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một sự kiện lịch sử thuộc Topic',
    description:
      'Yêu cầu quyền quản trị (Admin/Moderator). Thêm mới một HistoricalEvent.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo sự kiện lịch sử thành công',
    type: HistoricalEventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'TopicId không tồn tại',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa xác thực token',
  })
  async create(@Body() dto: CreateHistoricalEventDto) {
    return this.historicalEventService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các sự kiện lịch sử',
    description:
      'Hỗ trợ phân trang, lọc theo topicId, eventYear, location và từ khóa tìm kiếm.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách sự kiện thành công',
  })
  async findAll(@Query() query: QueryHistoricalEventDto) {
    return this.historicalEventService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một sự kiện lịch sử theo ID',
    description: 'Trả về thông tin chi tiết của một HistoricalEvent cụ thể.',
  })
  @ApiParam({ name: 'id', description: 'UUID của sự kiện', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy sự kiện',
    type: HistoricalEventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy sự kiện',
  })
  async findOne(@Param('id') id: string) {
    return this.historicalEventService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin một sự kiện lịch sử',
    description:
      'Yêu cầu quyền quản trị. Cập nhật thông tin của HistoricalEvent.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của sự kiện cần sửa',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: HistoricalEventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy sự kiện hoặc TopicId mới',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateHistoricalEventDto) {
    return this.historicalEventService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa một sự kiện lịch sử',
    description: 'Yêu cầu quyền quản trị. Xóa HistoricalEvent khỏi hệ thống.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của sự kiện cần xóa',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa sự kiện thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy sự kiện',
  })
  async remove(@Param('id') id: string) {
    return this.historicalEventService.remove(id);
  }
}
