import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';

export class TopicResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', description: 'ID của chủ đề' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID của giai đoạn thuộc về' })
  periodId: string;

  @ApiProperty({ example: 'Khởi nghĩa Hai Bà Trưng', description: 'Tên chủ đề lịch sử' })
  name: string;

  @ApiPropertyOptional({
    example: 'Cuộc khởi nghĩa chống lại ách đô hộ nhà Hán năm 40-43 NCN',
    description: 'Mô tả chi tiết',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/images/hai-ba-trung.jpg',
    description: 'Ảnh đại diện chủ đề',
  })
  coverImageUrl?: string | null;

  @ApiProperty({ example: false, description: 'Yêu cầu học theo thứ tự hay không' })
  isSequential: boolean;

  @ApiProperty({ example: 1, description: 'Thứ tự hiển thị' })
  displayOrder: number;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.PUBLISHED, description: 'Trạng thái' })
  status: ContentStatus;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày cập nhật' })
  updatedAt: Date;
}
