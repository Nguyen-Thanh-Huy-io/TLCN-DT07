import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LessonStatus } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({
    example: 'Chiến thắng Bạch Đằng năm 938',
    description: 'Tiêu đề bài học lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài học không được để trống' })
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'chien-thang-bach-dang-nam-938',
    description: 'URL Slug định danh duy nhất (tự động tạo từ tiêu đề nếu để trống)',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Tổng quan về chiến thắng Bạch Đằng năm 938 chấm dứt hơn 1000 năm Bắc thuộc.',
    description: 'Mô tả tóm tắt nội dung bài học',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Tổng quan bài học',
    description: 'Bí danh (alias) tương thích ngược cho description',
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({
    example: [{ type: 'paragraph', text: 'Năm 938, Ngô Quyền đã dùng trận địa cọc gỗ...' }],
    description: 'Cấu trúc nội dung bài học dạng JSON / JSONB',
  })
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({
    example: '<p>Nội dung HTML cũ</p>',
    description: 'Bí danh (alias) tương thích ngược cho content',
  })
  @IsOptional()
  contentRichText?: any;

  @ApiPropertyOptional({
    enum: LessonStatus,
    example: LessonStatus.DRAFT,
    description: 'Trạng thái bài học (DRAFT, REVIEW, PUBLISHED, ARCHIVED)',
    default: LessonStatus.DRAFT,
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus = LessonStatus.DRAFT;

  @ApiPropertyOptional({ description: 'Ảnh bìa bài học (tùy chọn)' })
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Độ khó bài học (tùy chọn)' })
  @IsOptional()
  difficulty?: any;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị (tùy chọn)' })
  @IsOptional()
  displayOrder?: any;

  @ApiPropertyOptional({ description: 'Nguồn tham khảo (tùy chọn)' })
  @IsOptional()
  sourceReferenceNote?: string;

  @ApiPropertyOptional({ description: 'Thẻ bài học (tùy chọn)' })
  @IsOptional()
  tags?: any;
}
