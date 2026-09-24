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
import { TopicService } from './topic.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { QueryTopicDto } from './dto/query-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('Topics - Chủ đề Lịch sử')
@Controller('topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo mới một chủ đề lịch sử thuộc Giai đoạn',
    description: 'Yêu cầu quyền quản trị (Admin/Moderator). Thêm mới một Topic.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo chủ đề thành công',
    type: TopicResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'PeriodId không tồn tại' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Chưa xác thực hoặc token không hợp lệ' })
  async create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicService.create(createTopicDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các chủ đề lịch sử',
    description: 'Hỗ trợ phân trang, lọc theo periodId, status và tìm kiếm từ khóa.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách chủ đề thành công',
  })
  async findAll(@Query() query: QueryTopicDto) {
    return this.topicService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một chủ đề lịch sử theo ID',
    description: 'Trả về thông tin chi tiết của một Topic cụ thể kèm thông tin Period.',
  })
  @ApiParam({ name: 'id', description: 'UUID của chủ đề', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy chủ đề',
    type: TopicResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy chủ đề' })
  async findOne(@Param('id') id: string) {
    return this.topicService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin một chủ đề lịch sử',
    description: 'Yêu cầu quyền quản trị. Cập nhật thông tin của Topic.',
  })
  @ApiParam({ name: 'id', description: 'UUID của chủ đề cần sửa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: TopicResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy chủ đề hoặc Period mới' })
  async update(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.topicService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa một chủ đề lịch sử',
    description: 'Yêu cầu quyền quản trị. Xóa Topic khỏi hệ thống.',
  })
  @ApiParam({ name: 'id', description: 'UUID của chủ đề cần xóa', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa chủ đề thành công',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy chủ đề' })
  async remove(@Param('id') id: string) {
    return this.topicService.remove(id);
  }
}
