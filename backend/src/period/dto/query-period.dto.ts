import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '@prisma/client';

export class QueryPeriodDto {
  @ApiPropertyOptional({
    example: 'Việt Nam',
    description: 'Lọc theo khu vực/tỉnh thành',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    enum: ContentStatus,
    description: 'Lọc theo trạng thái nội dung (mặc định cho user là PUBLISHED)',
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({
    example: 'Bắc thuộc',
    description: 'Tìm kiếm theo tên hoặc mô tả giai đoạn',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại (bắt đầu từ 1)',
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
}
