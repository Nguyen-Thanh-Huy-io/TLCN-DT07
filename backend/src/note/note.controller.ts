import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../common/config/app.config';
import { CreateNoteDto, QueryNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NoteService } from './note.service';

const X_GUEST_ID_HEADER = 'x-guest-id';

@ApiTags('Notes (Ghi chú bài học & bài viết)')
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  private extractUserId(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, config.jwt_access_secret) as {
        userId?: string;
      };
      return payload?.userId;
    } catch {
      return undefined;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách ghi chú theo bài viết / bài học' })
  findAll(
    @Req() req: Request,
    @Query() query: QueryNoteDto,
    @Headers(X_GUEST_ID_HEADER) guestHeader?: string,
  ) {
    const userId = this.extractUserId(req);
    const guestId = query.guestId || guestHeader;
    return this.noteService.findAll(userId, { ...query, guestId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết một ghi chú' })
  findOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('guestId') guestQuery?: string,
    @Headers(X_GUEST_ID_HEADER) guestHeader?: string,
  ) {
    const userId = this.extractUserId(req);
    const guestId = guestQuery || guestHeader;
    return this.noteService.findOne(id, userId, guestId);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo ghi chú mới (hỗ trợ cả người dùng đăng nhập & khách)',
  })
  create(
    @Body() dto: CreateNoteDto,
    @Req() req: Request,
    @Headers(X_GUEST_ID_HEADER) guestHeader?: string,
  ) {
    const userId = this.extractUserId(req);
    const guestId = dto.guestId || guestHeader;
    return this.noteService.create({ ...dto, guestId }, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nội dung / màu sắc ghi chú' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @Req() req: Request,
    @Query('guestId') guestQuery?: string,
    @Headers(X_GUEST_ID_HEADER) guestHeader?: string,
  ) {
    const userId = this.extractUserId(req);
    const guestId = guestQuery || guestHeader;
    return this.noteService.update(id, dto, userId, guestId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá một ghi chú' })
  remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('guestId') guestQuery?: string,
    @Headers(X_GUEST_ID_HEADER) guestHeader?: string,
  ) {
    const userId = this.extractUserId(req);
    const guestId = guestQuery || guestHeader;
    return this.noteService.remove(id, userId, guestId);
  }
}
