import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityType } from '@prisma/client';

export class HistoricalEntityResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID duy nhất của thực thể lịch sử (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'Ngô Quyền',
    description: 'Tên thực thể lịch sử',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Ngô Vương',
    description: 'Tên gốc / Tự hiệu',
  })
  originalName?: string | null;

  @ApiProperty({
    enum: EntityType,
    example: EntityType.PERSON,
    description: 'Loại thực thể',
  })
  type: EntityType;

  @ApiPropertyOptional({
    example: 'Đại Việt',
    description: 'Quốc tịch / Xuất xứ',
  })
  nationality?: string | null;

  @ApiPropertyOptional({
    example: 897,
    description: 'Năm bắt đầu',
  })
  startYear?: number | null;

  @ApiPropertyOptional({
    example: 944,
    description: 'Năm kết thúc',
  })
  endYear?: number | null;

  @ApiPropertyOptional({
    example: '897 - 944',
    description: 'Chuỗi niên đại',
  })
  timeDisplay?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/images/ngo-quyen.jpg',
    description: 'URL ảnh minh họa',
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: 'Tiểu sử hoặc mô tả tóm tắt...',
    description: 'Mô tả chi tiết',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: { dynasty: 'Nhà Ngô' },
    description: 'Metadata linh hoạt',
  })
  metadata?: any;

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
