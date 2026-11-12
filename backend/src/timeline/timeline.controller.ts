import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentWrite, RequireRoles } from '../common/access/access.decorator';
import { ROLE_GROUPS } from '../common/access/access.constant';
import {
  CreateTimelineDto,
  QueryTimelineDto,
  UpdateTimelineDto,
} from './dto/timeline.dto';
import { TimelineService } from './timeline.service';

/** API CMS cho dòng thời gian. Trang công khai dùng /public/timelines. */
@ApiTags('Timelines (Dòng thời gian)')
@Controller('timelines')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Danh sách dòng thời gian (kèm số mốc)' })
  findAll(@Query() query: QueryTimelineDto) {
    return this.timelineService.findAll(query);
  }

  @Get(':id')
  @RequireRoles(...ROLE_GROUPS.STAFF)
  @ApiOperation({ summary: 'Chi tiết dòng thời gian kèm toàn bộ mốc' })
  findOne(@Param('id') id: string) {
    return this.timelineService.findOne(id);
  }

  @Post()
  @ContentWrite({ model: 'timeline' })
  @ApiOperation({ summary: 'Tạo dòng thời gian (có thể kèm mốc)' })
  create(@Body() dto: CreateTimelineDto) {
    return this.timelineService.create(dto);
  }

  @Patch(':id')
  @ContentWrite({ model: 'timeline', idParam: 'id' })
  @ApiOperation({
    summary: 'Cập nhật dòng thời gian; gửi `nodes` để thay toàn bộ mốc',
  })
  update(@Param('id') id: string, @Body() dto: UpdateTimelineDto) {
    return this.timelineService.update(id, dto);
  }

  @Delete(':id')
  @ContentWrite({ model: 'timeline', idParam: 'id' })
  @ApiOperation({ summary: 'Xoá dòng thời gian' })
  remove(@Param('id') id: string) {
    return this.timelineService.remove(id);
  }
}
