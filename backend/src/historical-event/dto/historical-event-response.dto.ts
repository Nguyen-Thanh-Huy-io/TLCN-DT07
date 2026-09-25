import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HistoricalEventResponseDto {
  @ApiProperty({
    example: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    description: 'ID sự kiện',
  })
  id: string;

  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    description: 'ID chủ đề thuộc về',
  })
  topicId: string;

  @ApiProperty({
    example: 'Trận Bạch Đằng năm 938',
    description: 'Tên sự kiện lịch sử',
  })
  title: string;

  @ApiProperty({ example: 938, description: 'Năm diễn ra sự kiện' })
  eventYear: number;

  @ApiPropertyOptional({
    example: 'Mùa thu năm 938',
    description: 'Ghi chú ngày tháng',
  })
  eventDateNote?: string | null;

  @ApiPropertyOptional({
    example: 'Ngô Quyền đánh tan quân Nam Hán...',
    description: 'Mô tả diễn biến',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'Sông Bạch Đằng, Quảng Ninh',
    description: 'Địa danh xảy ra',
  })
  location?: string | null;

  @ApiProperty({ example: 1, description: 'Thứ tự hiển thị' })
  displayOrder: number;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({
    example: '2026-09-24T00:00:00.000Z',
    description: 'Ngày cập nhật',
  })
  updatedAt: Date;
}
