import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../common/guards/auth.guard';
import { DiscussionService } from './discussion.service';
import {
  CreateDiscussionReplyDto,
  CreateDiscussionThreadDto,
  QueryDiscussionDto,
} from './dto/discussion.dto';

interface AuthedRequest {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('Discussions (Hỏi đáp & Thảo luận)')
@Controller('discussions')
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thảo luận (hỗ trợ lọc theo targetType, targetId, learningPathId)' })
  findAll(@Query() query: QueryDiscussionDto) {
    return this.discussionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết câu hỏi kèm danh sách câu trả lời' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.discussionService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Đặt câu hỏi / tạo chủ đề thảo luận mới' })
  create(
    @Req() req: AuthedRequest,
    @Body() dto: CreateDiscussionThreadDto,
  ) {
    return this.discussionService.create(req.user.userId, dto);
  }

  @Post(':id/replies')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Trả lời câu hỏi (nếu BTV/Admin trả lời sẽ tự động gắn isOfficial)' })
  createReply(
    @Req() req: AuthedRequest,
    @Param('id', new ParseUUIDPipe()) threadId: string,
    @Body() dto: CreateDiscussionReplyDto,
  ) {
    return this.discussionService.createReply(req.user.userId, req.user.role, threadId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Xoá câu hỏi / chủ đề thảo luận' })
  remove(
    @Req() req: AuthedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.discussionService.remove(req.user.userId, req.user.role, id);
  }
}
