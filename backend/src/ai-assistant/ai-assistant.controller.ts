import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';
import { AI_ASSISTANT_ROUTES } from './ai-assistant.constant';
import {
  AiAssistantChatResponse,
  AiAssistantService,
} from './ai-assistant.service';
import { AskAiAssistantDto } from './dto/ai-assistant.dto';

interface MaybeAuthedRequest {
  user?: { userId?: string };
}

@ApiTags('AI Assistant - Trợ lý Sử học & Điều hướng HISGO')
@Controller(AI_ASSISTANT_ROUTES.ROOT)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post(AI_ASSISTANT_ROUTES.CHAT)
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Trò chuyện với Trợ lý Sử học AI HISGO (giải đáp sử liệu, hướng dẫn tính năng & tra cứu tiến độ)',
  })
  chat(
    @Req() req: MaybeAuthedRequest,
    @Body() dto: AskAiAssistantDto,
  ): Promise<AiAssistantChatResponse> {
    return this.aiAssistantService.chat(req.user?.userId, dto);
  }
}
