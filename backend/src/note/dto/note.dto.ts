import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteColor, NoteTargetType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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

  @ApiProperty({ description: 'Nội dung ghi chú cá nhân' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Đoạn văn bản trích dẫn / bôi đen' })
  @IsOptional()
  @IsString()
  highlightText?: string;

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

  @ApiPropertyOptional({ description: 'Nội dung ghi chú cá nhân' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
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
