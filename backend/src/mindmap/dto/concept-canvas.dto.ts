import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CONCEPT_CANVAS_LIMITS } from '../concept-canvas.constant';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ExploreConceptDto {
  @ApiProperty({
    description: 'Khái niệm hoặc câu hỏi lịch sử cần khám phá trên Canvas',
    example: 'Chiến thắng Bạch Đằng 938',
  })
  @IsString()
  @Transform(trimString)
  @MinLength(CONCEPT_CANVAS_LIMITS.MIN_PROMPT_LENGTH)
  @MaxLength(CONCEPT_CANVAS_LIMITS.MAX_PROMPT_LENGTH)
  prompt!: string;

  @ApiPropertyOptional({
    description: 'Tiêu đề nút cha để giữ mạch ngữ cảnh phân nhánh',
  })
  @IsOptional()
  @IsString()
  @Transform(trimString)
  @MaxLength(CONCEPT_CANVAS_LIMITS.MAX_PARENT_TITLE_LENGTH)
  parentTitle?: string;

  @ApiPropertyOptional({
    description: 'Slug bài viết HISGO xuất phát (ưu tiên nạp tư liệu gốc)',
  })
  @IsOptional()
  @IsString()
  @Transform(trimString)
  @MaxLength(CONCEPT_CANVAS_LIMITS.MAX_ARTICLE_SLUG_LENGTH)
  articleSlug?: string;

  @ApiPropertyOptional({
    description: 'Danh sách khái niệm/câu hỏi đã mở trên cây để tránh lặp',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CONCEPT_CANVAS_LIMITS.MAX_EXCLUDE_PROMPTS)
  @IsString({ each: true })
  excludePrompts?: string[];

  @ApiPropertyOptional({
    description:
      'Bật tra cứu mở rộng qua Google Search (mặc định tắt — chỉ dùng kho nội bộ HISGO & Vertex RAG)',
  })
  @IsOptional()
  @IsBoolean()
  useGoogleSearch?: boolean;
}
