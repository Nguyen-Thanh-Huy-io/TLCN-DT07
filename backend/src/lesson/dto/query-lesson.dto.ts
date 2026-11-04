import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LessonStatus } from '@prisma/client';

export class QueryLessonDto {
  @ApiPropertyOptional({
    enum: LessonStatus,
    description: 'Lọc theo trạng thái bài học (DRAFT, REVIEW, PUBLISHED, ARCHIVED)',
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;

  @ApiPropertyOptional({
    example: 'bach-dang',
    description: 'Tìm kiếm theo tiêu đề, slug hoặc mô tả bài học',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng mục trên mỗi trang (tối đa 100)',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'ID chủ đề liên quan (tùy chọn / tương thích ngược)',
  })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID nhãn phân loại (Tag ID)',
  })
  @IsString()
  @IsOptional()
  tagId?: string;

  @ApiPropertyOptional({
    description: 'Độ khó bài học (tùy chọn / tương thích ngược)',
  })
  @IsString()
  @IsOptional()
  difficulty?: string;
}
