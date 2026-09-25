import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class ReviewLessonDto {
  @ApiProperty({
    enum: [ContentStatus.PUBLISHED, ContentStatus.REJECTED],
    example: ContentStatus.PUBLISHED,
    description:
      'Quyết định kiểm duyệt (PUBLISHED: Cho phép xuất bản, REJECTED: Từ chối)',
  })
  @IsEnum(ContentStatus)
  @IsNotEmpty({ message: 'Trạng thái duyệt không được để trống' })
  status: ContentStatus;

  @ApiProperty({
    example:
      'Nội dung thiếu nguồn trích dẫn chính xác, cần làm rõ mốc thời gian...',
    description: 'Lý do từ chối (bắt buộc khi status = REJECTED)',
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
