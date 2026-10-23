import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,  HttpStatus,
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
import { ContentWrite } from '../common/access/access.decorator';

@ApiTags('Historical Events - Sự kiện Lịch sử')
@Controller('historical-events')
export class HistoricalEventController {
  constructor(
    private readonly historicalEventService: HistoricalEventService,
  ) {}

  @Post()
  @ContentWrite({ model: 'historicalEvent' })
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
  @ContentWrite({ model: 'historicalEvent', idParam: 'id', versioned: true })
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
  @ContentWrite({ model: 'historicalEvent', idParam: 'id' })
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

  @Post(':id/relations')
  @ContentWrite({ model: 'historicalEvent', idParam: 'id' })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Thêm quan hệ tri thức/nhân quả cho sự kiện',
    description:
      'Tạo mối liên kết định hướng giữa sự kiện nguồn và sự kiện đích (nguyên nhân, hệ quả, tiền đề...).',
  })
  @ApiParam({ name: 'id', description: 'UUID của sự kiện nguồn (Source Event)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Thêm mối quan hệ sự kiện thành công',
  })
  async addRelation(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.historicalEventService.addRelation(id, dto);
  }

  @Delete('relations/:relationId')
  @ContentWrite()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Xóa quan hệ giữa 2 sự kiện',
    description: 'Hủy bỏ liên kết quan hệ theo ID quan hệ.',
  })
  @ApiParam({ name: 'relationId', description: 'UUID của quan hệ cần xóa' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa quan hệ thành công',
  })
  async removeRelation(@Param('relationId') relationId: string) {
    return this.historicalEventService.removeRelation(relationId);
  }

  @Get(':id/graph')
  @ApiOperation({
    summary: 'Lấy đồ thị tri thức quan hệ nhân quả (Nodes & Edges) của sự kiện',
    description:
      'Trả về cấu trúc dữ liệu mạng lưới quan hệ đa chiều phục vụ trực quan hóa đồ thị tri thức.',
  })
  @ApiParam({ name: 'id', description: 'UUID của sự kiện trung tâm' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy đồ thị sự kiện thành công',
  })
  async getEventGraph(@Param('id') id: string) {
    return this.historicalEventService.getEventGraph(id);
  }
}

