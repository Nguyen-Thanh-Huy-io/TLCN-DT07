import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteColor, NoteKind, NoteTargetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/** Đủ để phân biệt các lần xuất hiện trùng của cùng một đoạn trong bài. */
export const NOTE_ANCHOR_CONTEXT_MAX_LENGTH = 64;
export const NOTE_HIGHLIGHT_MAX_LENGTH = 1000;
export const NOTE_ANCHOR_ID_MAX_LENGTH = 100;
export const NOTE_LABEL_MAX_LENGTH = 40;
export const NOTE_LABELS_MAX = 10;

/** Loại được để trống nội dung (chỉ đánh dấu đoạn); các loại khác bắt buộc viết nội dung. */
export const NOTE_KINDS_WITHOUT_CONTENT: readonly NoteKind[] = [
  NoteKind.HIGHLIGHT,
  NoteKind.IMPORTANT,
];

/** Nội dung bắt buộc trừ khi là đánh dấu (không ghi loại = tô sáng) một đoạn có trích dẫn. */
const contentRequired = (dto: { highlightText?: string; kind?: NoteKind }) =>
  !dto.highlightText ||
  (dto.kind !== undefined && !NOTE_KINDS_WITHOUT_CONTENT.includes(dto.kind));

/** Vị trí để tô lại đúng chỗ khi mở bài: chữ trước / sau đoạn bôi đen, hoặc tiêu đề của mục được tóm tắt. */
export class NoteAnchorDto {
  @ApiPropertyOptional({ description: 'Chữ ngay trước đoạn bôi đen' })
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_ANCHOR_CONTEXT_MAX_LENGTH)
  prefix?: string;

  @ApiPropertyOptional({ description: 'Chữ ngay sau đoạn bôi đen' })
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_ANCHOR_CONTEXT_MAX_LENGTH)
  suffix?: string;

  @ApiPropertyOptional({ description: 'Id tiêu đề của mục được tóm tắt' })
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_ANCHOR_ID_MAX_LENGTH)
  headingId?: string;
}

export class CreateNoteDto {
  @ApiProperty({ enum: NoteTargetType, example: NoteTargetType.ARTICLE })
  @IsEnum(NoteTargetType)
  targetType: NoteTargetType;

  @ApiProperty({ description: 'ID của Bài viết hoặc Bài học' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiPropertyOptional({ description: 'Tiêu đề ghi chú' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    enum: NoteKind,
    description:
      'Không gửi: nội dung rỗng → HIGHLIGHT, có nội dung → NOTE (tương thích ghi chú cũ)',
  })
  @IsOptional()
  @IsEnum(NoteKind)
  kind?: NoteKind;

  @ApiProperty({
    description:
      'Nội dung ghi chú; để trống khi chỉ đánh dấu (HIGHLIGHT / IMPORTANT) một đoạn có highlightText',
  })
  @IsString()
  @ValidateIf(contentRequired)
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description:
      'Đoạn văn bản trích dẫn / bôi đen (thuật ngữ khi kind = DEFINITION)',
  })
  @ValidateIf(
    (dto: CreateNoteDto) =>
      dto.highlightText !== undefined || dto.kind === NoteKind.DEFINITION,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(NOTE_HIGHLIGHT_MAX_LENGTH)
  highlightText?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Nhãn tự do của người học',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(NOTE_LABELS_MAX)
  @IsString({ each: true })
  @MaxLength(NOTE_LABEL_MAX_LENGTH, { each: true })
  labels?: string[];

  @ApiPropertyOptional({ type: NoteAnchorDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NoteAnchorDto)
  anchor?: NoteAnchorDto;

  @ApiPropertyOptional({ enum: NoteColor, default: NoteColor.YELLOW })
  @IsOptional()
  @IsEnum(NoteColor)
  color?: NoteColor = NoteColor.YELLOW;

  @ApiPropertyOptional({ description: 'Mã định danh khách nếu chưa đăng nhập' })
  @IsOptional()
  @IsString()
  guestId?: string;
}

export class UpdateNoteDto {
  @ApiPropertyOptional({ description: 'Tiêu đề ghi chú' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Nội dung ghi chú; rỗng = chỉ còn tô màu',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Đoạn văn bản trích dẫn / bôi đen' })
  @IsOptional()
  @IsString()
  highlightText?: string;

  @ApiPropertyOptional({ enum: NoteColor })
  @IsOptional()
  @IsEnum(NoteColor)
  color?: NoteColor;

  @ApiPropertyOptional({ enum: NoteKind })
  @IsOptional()
  @IsEnum(NoteKind)
  kind?: NoteKind;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(NOTE_LABELS_MAX)
  @IsString({ each: true })
  @MaxLength(NOTE_LABEL_MAX_LENGTH, { each: true })
  labels?: string[];

  @ApiPropertyOptional({
    type: NoteAnchorDto,
    description:
      'Gắn lại vị trí (bài đã đổi); phiên bản bài được cập nhật theo',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NoteAnchorDto)
  anchor?: NoteAnchorDto;

  @ApiPropertyOptional({
    description: 'Câu hỏi: true = đã hiểu, false = mở lại',
  })
  @IsOptional()
  @IsBoolean()
  resolved?: boolean;
}

export class QueryNoteDto {
  @ApiPropertyOptional({ enum: NoteTargetType })
  @IsOptional()
  @IsEnum(NoteTargetType)
  targetType?: NoteTargetType;

  @ApiPropertyOptional({ description: 'Lọc theo targetId' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo guestId' })
  @IsOptional()
  @IsString()
  guestId?: string;
}
