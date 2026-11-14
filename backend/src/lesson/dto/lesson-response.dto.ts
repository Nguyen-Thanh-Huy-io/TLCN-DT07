import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DifficultyLevel, ContentStatus, Prisma, Tag } from '@prisma/client';

export class LessonResponseDto {
  @ApiProperty({
    example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    description: 'ID bài học',
  })
  id: string;

  @ApiProperty({
    example: 'Chiến thắng Bạch Đằng năm 938',
    description: 'Tiêu đề bài học',
  })
  title: string;

  @ApiProperty({
    example: 'chien-thang-bach-dang-nam-938',
    description: 'URL Slug định danh duy nhất',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'Tổng quan về chiến thắng Bạch Đằng năm 938...',
    description: 'Mô tả tóm tắt nội dung bài học',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'Tổng quan bài học',
    description: 'Bí danh (alias) tương thích ngược cho description',
  })
  summary?: string | null;

  @ApiProperty({
    example: [{ type: 'paragraph', text: 'Năm 938, Ngô Quyền...' }],
    description: 'Cấu trúc nội dung bài học dạng JSON / JSONB',
  })
  content: Prisma.JsonValue;

  @ApiPropertyOptional({
    example: '[{"type":"paragraph","text":"..."}]',
    description: 'Bí danh tương thích ngược cho TipTap',
  })
  contentRichText?: string | null;

  @ApiProperty({
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
    description: 'Trạng thái bài học',
  })
  status: ContentStatus;

  @ApiPropertyOptional({
    description: 'Lý do từ chối duyệt bài nếu bị REJECTED',
    example: 'Thiếu nguồn sử liệu',
  })
  rejectionReason?: string | null;

  @ApiPropertyOptional({
    description: 'ID người đã duyệt hoặc từ chối bài học',
  })
  reviewedBy?: string | null;

  @ApiPropertyOptional({
    description: 'Thời điểm duyệt hoặc từ chối bài học',
  })
  reviewedAt?: Date | null;

  @ApiPropertyOptional({
    enum: DifficultyLevel,
    description: 'Độ khó bài học',
  })
  difficulty?: DifficultyLevel;

  @ApiProperty({
    example: 5,
    description: 'Thời gian đọc ước tính (phút)',
  })
  estimatedReadMinutes: number;

  @ApiPropertyOptional({
    example: 'topic-uuid',
    description: 'ID Chương học / Chủ đề gom nhóm bài học',
  })
  topicId?: string | null;

  @ApiPropertyOptional({
    example: 'topic-uuid',
    description: 'Bí danh (alias) Chapter ID',
  })
  chapterId?: string | null;

  @ApiPropertyOptional({
    description: 'Thông tin chi tiết Chương học (Chapter)',
  })
  chapter?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Danh sách thẻ phân loại bài học',
  })
  tags?: Tag[];

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị bài học trong chương',
  })
  displayOrder?: number;

  @ApiProperty({ example: '2026-10-18T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-18T10:00:00.000Z' })
  updatedAt: Date;
}
