import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus } from '@prisma/client';

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
  content: any;

  @ApiPropertyOptional({
    example: '[{"type":"paragraph","text":"..."}]',
    description: 'Bí danh tương thích ngược cho TipTap',
  })
  contentRichText?: string | null;

  @ApiProperty({
    enum: LessonStatus,
    example: LessonStatus.DRAFT,
    description: 'Trạng thái bài học',
  })
  status: LessonStatus;

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
  chapter?: any;

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
