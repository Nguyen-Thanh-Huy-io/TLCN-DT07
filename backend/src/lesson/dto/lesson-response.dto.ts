import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, DifficultyLevel } from '@prisma/client';

export class UserSummaryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'history_editor' })
  username: string;
}

export class LessonResponseDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', description: 'ID bài học' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', description: 'ID chủ đề thuộc về' })
  topicId: string;

  @ApiProperty({ example: 'Chiến thắng Bạch Đằng năm 938', description: 'Tiêu đề bài học' })
  title: string;

  @ApiPropertyOptional({ example: '<p>Nội dung chi tiết...</p>', description: 'Nội dung Rich Text' })
  contentRichText?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg', description: 'Thumbnail' })
  thumbnailUrl?: string | null;

  @ApiProperty({ enum: DifficultyLevel, example: DifficultyLevel.MEDIUM, description: 'Độ khó' })
  difficulty: DifficultyLevel;

  @ApiProperty({ example: 10, description: 'XP thưởng khi hoàn thành' })
  xpReward: number;

  @ApiProperty({ example: 5, description: 'Thời gian đọc ước tính (phút - tự tính toán)' })
  estimatedReadMinutes: number;

  @ApiPropertyOptional({ example: 'Tư liệu lịch sử...', description: 'Nguồn tham khảo' })
  sourceReferenceNote?: string | null;

  @ApiProperty({ example: 1, description: 'Thứ tự hiển thị' })
  displayOrder: number;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.PUBLISHED, description: 'Trạng thái' })
  status: ContentStatus;

  @ApiPropertyOptional({ example: 'Lý do bị từ chối...', description: 'Lý do từ chối' })
  rejectionReason?: string | null;

  @ApiPropertyOptional({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày xuất bản' })
  publishedAt?: Date | null;

  @ApiProperty({ example: 'uuid-creator-id', description: 'ID người tạo' })
  createdBy: string;

  @ApiPropertyOptional({ type: UserSummaryDto, description: 'Thông tin người tạo' })
  creator?: UserSummaryDto;

  @ApiPropertyOptional({ example: 'uuid-approver-id', description: 'ID người duyệt' })
  approvedBy?: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, description: 'Thông tin người duyệt' })
  approver?: UserSummaryDto | null;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày tạo' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-24T00:00:00.000Z', description: 'Ngày cập nhật' })
  updatedAt: Date;
}
