import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  AI_ASSISTANT_LIMITS,
  AssistantChatRole,
} from '../ai-assistant.constant';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ChatHistoryItemDto {
  @ApiProperty({ enum: AssistantChatRole })
  @IsEnum(AssistantChatRole)
  role: AssistantChatRole;

  @ApiProperty({
    example: 'Nhà Trần có mấy lần kháng chiến chống Nguyên Mông?',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(AI_ASSISTANT_LIMITS.MAX_MESSAGE_LENGTH)
  content: string;
}

export class AskAiAssistantDto {
  @ApiProperty({
    description: 'Câu hỏi hoặc yêu cầu của người dùng gửi cho Trợ lý AI HISGO',
    example:
      'Hướng dẫn tôi cách ôn tập thẻ ghi nhớ và vẽ sơ đồ tư duy trên HISGO',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(AI_ASSISTANT_LIMITS.MAX_MESSAGE_LENGTH)
  message: string;

  @ApiPropertyOptional({
    description:
      'Đường dẫn trang hiện tại người dùng đang đứng (VD: /bai-viet/nha-tran)',
    example: '/bai-viet/nha-tran',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(AI_ASSISTANT_LIMITS.MAX_PATH_LENGTH)
  currentPath?: string;

  @ApiPropertyOptional({
    description:
      'Văn bản tiêu đề & các mục chính đang hiển thị trực tiếp trên màn hình người dùng',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  pageContext?: string;

  @ApiPropertyOptional({
    description: 'Lịch sử hội thoại gần nhất trong phiên',
    type: [ChatHistoryItemDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(AI_ASSISTANT_LIMITS.MAX_HISTORY_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
