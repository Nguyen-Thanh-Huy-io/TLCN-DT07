import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryQuizDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo tiêu đề đề thi hoặc mô tả' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo UUID của Chủ đề / Chuyên đề' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo UUID của Bài học liên kết' })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái đề (ACTIVE, DRAFT, all)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Số trang (bắt đầu từ 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số bản ghi trên mỗi trang', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
