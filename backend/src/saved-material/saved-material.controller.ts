import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SavedMaterialKind } from '@prisma/client';
import { AuthGuard } from '../common/guards/auth.guard';
import { ToggleSavedMaterialDto } from './dto/saved-material.dto';
import { SAVED_MATERIAL_ROUTES } from './saved-material.constant';
import { SavedMaterialService } from './saved-material.service';

interface AuthedRequest {
  user: { userId: string };
}

@ApiTags('Tư liệu đã lưu (bài viết / bài học / mốc dấu mộc lịch sử)')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller(SAVED_MATERIAL_ROUTES.ROOT)
export class SavedMaterialController {
  constructor(private readonly savedMaterialService: SavedMaterialService) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách id tư liệu đã lưu của người dùng hiện tại',
  })
  getSnapshot(@Req() req: AuthedRequest) {
    return this.savedMaterialService.getSnapshot(req.user.userId);
  }

  @Post(SAVED_MATERIAL_ROUTES.TOGGLE)
  @ApiOperation({ summary: 'Lưu / bỏ lưu một tư liệu' })
  toggle(@Req() req: AuthedRequest, @Body() dto: ToggleSavedMaterialDto) {
    return this.savedMaterialService.toggle(
      req.user.userId,
      dto.kind,
      dto.targetId,
    );
  }

  @Delete(SAVED_MATERIAL_ROUTES.BY_KIND_AND_TARGET)
  @ApiOperation({ summary: 'Bỏ lưu một tư liệu theo loại và mã' })
  remove(
    @Req() req: AuthedRequest,
    @Param('kind', new ParseEnumPipe(SavedMaterialKind))
    kind: SavedMaterialKind,
    @Param('targetId') targetId: string,
  ) {
    return this.savedMaterialService.remove(req.user.userId, kind, targetId);
  }
}
