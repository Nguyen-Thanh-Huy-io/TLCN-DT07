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
import { AssignChildrenDto } from './dto/assign-children.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
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
    description:
      'Yêu cầu quyền quản trị (Admin/Moderator). Thêm mới một Topic.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo chủ đề thành công',
    type: TopicResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'PeriodId không tồn tại',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa xác thực hoặc token không hợp lệ',
  })
  async create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicService.create(createTopicDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các chủ đề lịch sử',
    description:
      'Hỗ trợ phân trang, lọc theo periodId, status và tìm kiếm từ khóa.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách chủ đề thành công',
  })
  async findAll(@Query() query: QueryTopicDto) {
    return this.topicService.findAll(query);
  }

  @Get('tree')
  @ApiOperation({
    summary: 'Lấy cấu trúc Cây Tri thức phân cấp (Composite Tree) của các chủ đề',
    description: 'Trả về cây đa cấp (Root topics kèm children và lessons)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy cây chủ đề thành công',
  })
  async getTopicTree(@Query('periodId') periodId?: string) {
    return this.topicService.getTopicTree(periodId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một chủ đề lịch sử theo ID',
    description:
      'Trả về thông tin chi tiết của một Topic cụ thể kèm thông tin Period.',
  })
  @ApiParam({ name: 'id', description: 'UUID của chủ đề', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tìm thấy chủ đề',
    type: TopicResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy chủ đề',
  })
  async findOne(@Param('id') id: string) {
    return this.topicService.findOne(id);
  }

  @Patch('reorder')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sắp xếp lại thứ tự hiển thị danh sách chủ đề (Batch Reordering)',
    description: 'Yêu cầu quyền quản trị. Cập nhật displayOrder cho nhiều chủ đề trong 1 transaction.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thứ tự hiển thị thành công',
  })
  async reorder(@Body() reorderTopicsDto: ReorderTopicsDto) {
    return this.topicService.reorder(reorderTopicsDto.items);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cập nhật thông tin một chủ đề lịch sử',
    description: 'Yêu cầu quyền quản trị. Cập nhật thông tin của Topic.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của chủ đề cần sửa',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: TopicResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy chủ đề hoặc Period mới',
  })
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
  @ApiParam({
    name: 'id',
    description: 'UUID của chủ đề cần xóa',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa chủ đề thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy chủ đề',
  })
  async remove(@Param('id') id: string) {
    return this.topicService.remove(id);
  }

  @Post(':id/children')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gắn danh sách chủ đề con vào chủ đề cha',
    description: 'Yêu cầu quyền quản trị. Gán các chủ đề con vào chủ đề :id.',
  })
  @ApiParam({ name: 'id', description: 'UUID của chủ đề cha', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gắn các chủ đề con thành công',
  })
  async assignChildren(
    @Param('id') id: string,
    @Body() assignChildrenDto: AssignChildrenDto,
  ) {
    return this.topicService.assignChildren(id, assignChildrenDto.childIds);
  }

  @Delete(':id/children/:childId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tách / Hủy gắn một chủ đề con khỏi chủ đề cha',
    description: 'Yêu cầu quyền quản trị. Chuyển chủ đề con thành chủ đề gốc độc lập.',
  })
  @ApiParam({ name: 'id', description: 'UUID của chủ đề cha', type: String })
  @ApiParam({
    name: 'childId',
    description: 'UUID của chủ đề con cần tách',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tách chủ đề con thành công',
  })
  async removeChild(
    @Param('id') id: string,
    @Param('childId') childId: string,
  ) {
    return this.topicService.removeChild(id, childId);
  }
}
