import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PostStatus, PostType } from '@prisma/client';

export class QueryPostDto {
  @ApiPropertyOptional({ description: 'Trang hiện tại', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số item mỗi trang', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tiêu đề / tóm tắt', example: 'Điện Biên' })
  @IsOptional()
  @IsString({ message: 'search phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({ enum: PostType, description: 'Loại bài viết' })
  @IsOptional()
  @IsEnum(PostType, { message: 'type không hợp lệ' })
  type?: PostType;

  @ApiPropertyOptional({ enum: PostStatus, description: 'Trạng thái bài viết' })
  @IsOptional()
  @IsEnum(PostStatus, { message: 'status không hợp lệ' })
  status?: PostStatus;
}
