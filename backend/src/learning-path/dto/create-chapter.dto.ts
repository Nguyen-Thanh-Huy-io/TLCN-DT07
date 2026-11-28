import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { ChapterQuizItemInputDto } from './chapter-lesson-action.dto';

export class CreateChapterDto {
  @ApiProperty({ description: 'ID Lộ trình học trực thuộc' })
  @IsString()
  @IsNotEmpty()
  learningPathId: string;

  @ApiProperty({
    description: 'Tên chương học',
    example: 'Chương 1. Việt Nam sau năm 1945',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả chương' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Thứ tự chương trong lộ trình',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'Danh sách đề kiểm tra gắn kèm ngay khi tạo chương',
    type: [ChapterQuizItemInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterQuizItemInputDto)
  quizItems?: ChapterQuizItemInputDto[];
}

export class UpdateChapterDto {
  @ApiPropertyOptional({ description: 'Tên chương học' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Mô tả chương' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Thứ tự chương trong lộ trình' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
