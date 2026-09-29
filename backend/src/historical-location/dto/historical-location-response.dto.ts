import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';

export class HistoricalLocationResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID duy nhất của địa điểm lịch sử (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'Khu di tích Bạch Đằng Giang',
    description: 'Tên địa danh lịch sử',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Cửa biển Bạch Đằng',
    description: 'Tên địa danh trong lịch sử',
  })
  historicalName?: string | null;

  @ApiProperty({
    enum: LocationType,
    example: LocationType.HISTORICAL_SITE,
    description: 'Phân loại địa danh',
  })
  type: LocationType;

  @ApiPropertyOptional({
    example: 'Việt Nam',
    description: 'Quốc gia hiện đại',
  })
  modernCountry?: string | null;

  @ApiPropertyOptional({
    example: 'Thủy Nguyên, Hải Phòng',
    description: 'Khu vực hành chính / Tỉnh / Thành phố hiện đại',
  })
  adminArea?: string | null;

  @ApiPropertyOptional({
    example: 20.9405,
    description: 'Vĩ độ GPS (Latitude)',
  })
  latitude?: number | null;

  @ApiPropertyOptional({
    example: 106.6833,
    description: 'Kinh độ GPS (Longitude)',
  })
  longitude?: number | null;

  @ApiPropertyOptional({
    example: { type: 'Point', coordinates: [106.6833, 20.9405] },
    description: 'Dữ liệu GeoJSON',
  })
  geoJson?: any;

  @ApiProperty({
    example: '2026-09-27T00:00:00.000Z',
    description: 'Thời điểm tạo',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-09-27T00:00:00.000Z',
    description: 'Thời điểm cập nhật gần nhất',
  })
  updatedAt: Date;
}
