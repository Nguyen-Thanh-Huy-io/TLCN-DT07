import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteColor, NoteTargetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
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

/** Vài chữ ngay trước / sau đoạn bôi đen, để tô lại đúng chỗ khi mở bài. */
export class NoteAnchorDto {
  @ApiProperty({ description: 'Chữ ngay trước đoạn bôi đen' })
  @IsString()
  @MaxLength(NOTE_ANCHOR_CONTEXT_MAX_LENGTH)
  prefix: string;

  @ApiProperty({ description: 'Chữ ngay sau đoạn bôi đen' })
  @IsString()
  @MaxLength(NOTE_ANCHOR_CONTEXT_MAX_LENGTH)
  suffix: string;
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

  @ApiProperty({
    description:
      'Nội dung ghi chú; để trống khi chỉ tô màu một đoạn (bắt buộc có highlightText)',
  })
  @IsString()
  @ValidateIf((dto: CreateNoteDto) => !dto.highlightText)
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Đoạn văn bản trích dẫn / bôi đen' })
  @IsOptional()
  @IsString()
  @MaxLength(NOTE_HIGHLIGHT_MAX_LENGTH)
  highlightText?: string;

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
