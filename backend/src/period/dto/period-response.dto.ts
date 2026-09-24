import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';

export class PeriodResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID của giai đoạn' })
  id: string;

  @ApiProperty({ example: 'Thời kỳ Bắc thuộc', description: 'Tên giai đoạn lịch sử' })
  name: string;

  @ApiPropertyOptional({ example: 'Việt Nam', description: 'Khu vực hoặc tỉnh thành liên quan' })
  region?: string | null;

  @ApiProperty({ example: -111, description: 'Năm bắt đầu' })
  startYear: number;

  @ApiPropertyOptional({ example: 938, description: 'Năm kết thúc' })
  endYear?: number | null;

  @ApiPropertyOptional({
    example: 'Giai đoạn đấu tranh bảo vệ độc lập dân tộc...',
    description: 'Mô tả chi tiết',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/images/cover.jpg',
    description: 'Ảnh đại diện',
  })
  coverImageUrl?: string | null;

  @ApiProperty({ example: 1, description: 'Thứ tự hiển thị' })
  displayOrder: number;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.PUBLISHED, description: 'Trạng thái' })
  status: ContentStatus;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày cập nhật' })
  updatedAt: Date;
}
