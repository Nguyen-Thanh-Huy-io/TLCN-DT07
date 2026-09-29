import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType } from '@prisma/client';

export class CreateHistoricalLocationDto {
  @ApiProperty({
    example: 'Khu di tích Bạch Đằng Giang',
    description: 'Tên địa danh / di tích lịch sử hiện nay',
    maxLength: 255,
  })
  @IsString({ message: 'Tên địa điểm phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên địa điểm không được để trống' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Cửa biển Bạch Đằng',
    description: 'Tên địa danh trong lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  historicalName?: string;

  @ApiPropertyOptional({
    enum: LocationType,
    example: LocationType.HISTORICAL_SITE,
    description:
      'Loại địa danh (HISTORICAL_SITE, BATTLEFIELD, SETTLEMENT, NATURAL_LANDSCAPE, EXPEDITION_ROUTE, ADMIN_TERRITORY)',
    default: LocationType.HISTORICAL_SITE,
  })
  @IsEnum(LocationType, { message: 'type phải là giá trị hợp lệ của LocationType' })
  @IsOptional()
  type?: LocationType = LocationType.HISTORICAL_SITE;

  @ApiPropertyOptional({
    example: 'Việt Nam',
    description: 'Quốc gia hiện đại',
    maxLength: 100,
    default: 'Việt Nam',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  modernCountry?: string = 'Việt Nam';

  @ApiPropertyOptional({
    example: 'Thủy Nguyên, Hải Phòng',
    description: 'Khu vực hành chính / Tỉnh / Thành phố hiện đại',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  adminArea?: string;

  @ApiPropertyOptional({
    example: 20.9405,
    description: 'Vĩ độ GPS (Latitude)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Vĩ độ (latitude) phải là số thực' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: 106.6833,
    description: 'Kinh độ GPS (Longitude)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Kinh độ (longitude) phải là số thực' })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: { type: 'Point', coordinates: [106.6833, 20.9405] },
    description: 'Dữ liệu GeoJSON ranh giới hoặc tuyến đường',
  })
  @IsOptional()
  geoJson?: any;
}
