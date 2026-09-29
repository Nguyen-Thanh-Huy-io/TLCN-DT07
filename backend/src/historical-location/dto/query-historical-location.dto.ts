import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType } from '@prisma/client';

export class QueryHistoricalLocationDto {
  @ApiPropertyOptional({
    enum: LocationType,
    description: 'Lọc theo loại địa điểm (HISTORICAL_SITE, BATTLEFIELD...)',
  })
  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;

  @ApiPropertyOptional({
    example: 'Hải Phòng',
    description: 'Lọc theo Khu vực hành chính / Tỉnh / Thành phố',
  })
  @IsString()
  @IsOptional()
  adminArea?: string;

  @ApiPropertyOptional({
    example: 'Việt Nam',
    description: 'Lọc theo quốc gia',
  })
  @IsString()
  @IsOptional()
  modernCountry?: string;

  @ApiPropertyOptional({
    example: 'Bạch Đằng',
    description: 'Tìm kiếm theo tên hoặc mô tả địa điểm',
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
