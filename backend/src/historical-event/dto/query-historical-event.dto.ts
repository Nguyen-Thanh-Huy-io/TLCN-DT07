import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, EventCategory } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryHistoricalEventDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Lọc sự kiện theo ID của Chủ đề (Topic)',
  })
  @IsUUID('4')
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Lọc sự kiện theo ID của Thời kỳ / Giai đoạn (Period)',
  })
  @IsUUID('4')
  @IsOptional()
  periodId?: string;

  @ApiPropertyOptional({
    description: 'Lọc sự kiện theo ID của Di tích / Địa danh (HistoricalSite entityId)',
  })
  @IsUUID('4')
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Alias backward-compatible cho siteId',
  })
  @IsUUID('4')
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'Lọc sự kiện theo ID của Sự kiện cha (parentId)',
  })
  @IsUUID('4')
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Chỉ lấy các sự kiện cấp cao nhất (parentId IS NULL)',
  })
  @IsOptional()
  topLevelOnly?: boolean | string;

  @ApiPropertyOptional({
    enum: ContentStatus,
    description: 'Lọc sự kiện theo trạng thái xuất bản (DRAFT, PENDING, PUBLISHED)',
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({
    example: 'MILITARY',
    description:
      'Lọc theo mã hoặc id loại sự kiện trong danh mục dùng chung; gồm cả loại con (MILITARY → trận đánh, chiến tranh)',
  })
  @IsString()
  @IsOptional()
  category?: string;

  /** Nội bộ: id loại đã mở rộng xuống loại con (service tính, client không gửi). */
  categoryTermIds?: string[];

  @ApiPropertyOptional({
    example: 938,
    description: 'Lọc sự kiện theo năm diễn ra',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  startYear?: number;

  @ApiPropertyOptional({
    example: 'Ngô Quyền',
    description: 'Tìm kiếm theo tên hoặc mô tả sự kiện',
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
}
