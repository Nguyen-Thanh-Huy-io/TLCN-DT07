import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import {
  MINDMAP_LIMITS,
  MINDMAP_MESSAGES,
  MindmapStructure,
  MindmapTemplateType,
} from '../mindmap.constant';

export enum MindmapDetailLevel {
  CONCISE = 'CONCISE',
  DETAILED = 'DETAILED',
}

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

function MaxJsonBytes(maxBytes: number, options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'maxMindmapGraphBytes',
      target: target.constructor,
      propertyName,
      options: { message: MINDMAP_MESSAGES.GRAPH_TOO_LARGE, ...options },
      validator: {
        validate: (value: unknown) =>
          Buffer.byteLength(JSON.stringify(value ?? null), 'utf8') <= maxBytes,
      },
    });
}

export class CreateMindmapDto {
  @ApiProperty({ example: 'Vương triều Nhà Trần' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MINDMAP_LIMITS.MAX_TITLE_LENGTH)
  title: string;

  @ApiPropertyOptional({ example: '1225 – 1400' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MINDMAP_LIMITS.MAX_PERIOD_LENGTH)
  periodLabel?: string;

  @ApiPropertyOptional({
    enum: MindmapTemplateType,
    default: MindmapTemplateType.SPIDER,
  })
  @IsOptional()
  @IsEnum(MindmapTemplateType)
  template?: MindmapTemplateType;

  @ApiPropertyOptional({ description: 'Đồ thị dựng sẵn' })
  @IsOptional()
  @IsObject()
  @MaxJsonBytes(MINDMAP_LIMITS.MAX_GRAPH_BYTES)
  graph?: Record<string, unknown>;
}

export class UpdateMindmapDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MINDMAP_LIMITS.MAX_TITLE_LENGTH)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MINDMAP_LIMITS.MAX_PERIOD_LENGTH)
  periodLabel?: string | null;

  @ApiPropertyOptional({ enum: MindmapTemplateType })
  @IsOptional()
  @IsEnum(MindmapTemplateType)
  template?: MindmapTemplateType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  @MaxJsonBytes(MINDMAP_LIMITS.MAX_GRAPH_BYTES)
  graph?: Record<string, unknown>;
}

export class GenerateMindmapDto {
  @ApiPropertyOptional({
    description:
      'Prompt / chủ đề hoặc đoạn văn bản sử liệu người học muốn xây dựng thành Sơ đồ tư duy',
    example:
      'Phân tích nguyên nhân, diễn biến 3 trận đánh lớn và ý nghĩa lịch sử của 3 lần kháng chiến chống quân Nguyên – Mông thời nhà Trần.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MINDMAP_LIMITS.MAX_PROMPT_LENGTH)
  prompt?: string;

  @ApiPropertyOptional({
    enum: MindmapStructure,
    default: MindmapStructure.MIND_MAP,
  })
  @IsOptional()
  @IsEnum(MindmapStructure)
  structure?: MindmapStructure;

  @ApiPropertyOptional({
    description: 'Tự động để AI nhận diện và quyết định cấu trúc sơ đồ tối ưu (Xương cá, Dòng thời gian, Tổ chức...)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoDetectStructure?: boolean;

  @ApiPropertyOptional({
    description: 'Bật tra cứu thông tin thời gian thực qua Google Search Grounding',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  useGoogleSearch?: boolean;

  @ApiPropertyOptional({
    description: 'Mức độ chi tiết của sơ đồ tư duy (CONCISE: Tóm lược, DETAILED: Chuyên sâu)',
    enum: MindmapDetailLevel,
    default: MindmapDetailLevel.DETAILED,
  })
  @IsOptional()
  @IsEnum(MindmapDetailLevel)
  detailLevel?: MindmapDetailLevel;

  @ApiPropertyOptional({
    description: 'Kết hợp ghi chú cá nhân của người học',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeNotes?: boolean;

  @ApiPropertyOptional({
    description: 'Danh sách ID bài viết đã lưu muốn đưa vào sơ đồ',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MINDMAP_LIMITS.MAX_AI_ARTICLES)
  @IsUUID('4', { each: true })
  articleIds?: string[];

  @ApiPropertyOptional({
    description:
      'Đồ thị hiện tại trên Canvas (để AI đọc ngữ cảnh những gì người dùng đã soạn và nối tiếp các nhánh còn thiếu)',
  })
  @IsOptional()
  @IsObject()
  @MaxJsonBytes(MINDMAP_LIMITS.MAX_GRAPH_BYTES)
  existingGraph?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'ID của node người dùng đang chọn trên Canvas (ưu tiên phát triển nhánh từ node này)',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  selectedNodeId?: string;
}
