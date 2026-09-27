import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '@prisma/client';

export class QueryQuizDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Số trang hiện tại (mặc định 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page phải là số nguyên' })
  @Min(1, { message: 'Page tối thiểu là 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng mục trên mỗi trang (mặc định 10, tối đa 100)',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Lọc quiz theo lessonId',
  })
  @IsOptional()
  @IsUUID('4', { message: 'lessonId phải là UUID hợp lệ' })
  lessonId?: string;

  @ApiPropertyOptional({
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'Lọc quiz theo topicId',
  })
  @IsOptional()
  @IsUUID('4', { message: 'topicId phải là UUID hợp lệ' })
  topicId?: string;

  @ApiPropertyOptional({
    enum: ContentStatus,
    example: ContentStatus.PUBLISHED,
    description: 'Lọc quiz theo trạng thái duyệt',
  })
  @IsOptional()
  @IsEnum(ContentStatus, { message: 'Trạng thái status không hợp lệ' })
  status?: ContentStatus;

  @ApiPropertyOptional({
    example: 'Bạch Đằng',
    description: 'Từ khóa tìm kiếm theo tiêu đề hoặc mô tả của Quiz',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi' })
  search?: string;
}
