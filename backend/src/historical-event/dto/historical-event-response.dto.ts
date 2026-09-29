import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HistoricalEventResponseDto {
  @ApiProperty({ example: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', description: 'ID sự kiện' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', description: 'ID chủ đề thuộc về' })
  topicId: string;

  @ApiProperty({ example: 'Trận Bạch Đằng năm 938', description: 'Tên sự kiện lịch sử' })
  title: string;

  @ApiPropertyOptional({ example: 938, description: 'Năm bắt đầu diễn ra sự kiện' })
  startYear?: number | null;

  @ApiPropertyOptional({ example: 938, description: 'Năm kết thúc sự kiện' })
  endYear?: number | null;

  @ApiPropertyOptional({ example: 'Mùa thu năm 938', description: 'Ghi chú ngày tháng' })
  eventDateNote?: string | null;

  @ApiPropertyOptional({ example: 'Ngô Quyền đánh tan quân Nam Hán...', description: 'Mô tả diễn biến' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'Sông Bạch Đằng, Quảng Ninh', description: 'Ghi chú địa danh' })
  locationNote?: string | null;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID địa điểm liên kết' })
  locationId?: string | null;

  @ApiProperty({ example: 1, description: 'Thứ tự hiển thị' })
  displayOrder: number;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày cập nhật' })
  updatedAt: Date;
}
