import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import {
  CreateMindmapDto,
  GenerateMindmapDto,
  UpdateMindmapDto,
} from './dto/mindmap.dto';
import { MINDMAP_ROUTES } from './mindmap.constant';
import { MindmapAiService } from './mindmap-ai.service';
import { MindmapService } from './mindmap.service';

interface AuthedRequest {
  user: { userId: string };
}

@ApiTags('Mindmaps - Sơ đồ tư duy Lịch sử')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller(MINDMAP_ROUTES.ROOT)
export class MindmapController {
  constructor(
    private readonly mindmapService: MindmapService,
    private readonly mindmapAiService: MindmapAiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sơ đồ tư duy của người học' })
  list(@Req() req: AuthedRequest) {
    return this.mindmapService.list(req.user.userId);
  }

  @Get(MINDMAP_ROUTES.BY_ID)
  @ApiOperation({ summary: 'Chi tiết một sơ đồ tư duy' })
  findOne(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.mindmapService.findOne(req.user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo sơ đồ tư duy mới (từ mẫu hoặc từ AI preview)' })
  create(@Req() req: AuthedRequest, @Body() dto: CreateMindmapDto) {
    return this.mindmapService.create(req.user.userId, dto);
  }

  @Post(MINDMAP_ROUTES.GENERATE_PREVIEW)
  @ApiOperation({
    summary: 'Phân tích ghi chú & bài viết đã lưu để gợi ý sơ đồ tư duy',
  })
  generatePreview(@Req() req: AuthedRequest, @Body() dto: GenerateMindmapDto) {
    return this.mindmapAiService.generatePreview(req.user.userId, dto);
  }

  @Patch(MINDMAP_ROUTES.BY_ID)
  @ApiOperation({ summary: 'Cập nhật tiêu đề, toạ độ node và liên kết' })
  update(
    @Req() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMindmapDto,
  ) {
    return this.mindmapService.update(req.user.userId, id, dto);
  }

  @Delete(MINDMAP_ROUTES.BY_ID)
  @ApiOperation({ summary: 'Xoá sơ đồ tư duy' })
  remove(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.mindmapService.remove(req.user.userId, id);
  }
}
