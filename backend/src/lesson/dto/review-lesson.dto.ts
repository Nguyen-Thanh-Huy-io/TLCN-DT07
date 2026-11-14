import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class ReviewLessonDto {
  @ApiProperty({
    enum: [
      ContentStatus.PUBLISHED,
      ContentStatus.REJECTED,
      ContentStatus.DRAFT,
    ],
    example: ContentStatus.PUBLISHED,
    description:
      'Quyết định kiểm duyệt (PUBLISHED: Cho phép xuất bản, REJECTED: Từ chối phê duyệt, DRAFT: Trả về bản nháp để sửa lại)',
  })
  @IsEnum(ContentStatus)
  @IsNotEmpty({ message: 'Trạng thái duyệt không được để trống' })
  status: ContentStatus;

  @ApiPropertyOptional({
    example:
      'Nội dung thiếu nguồn trích dẫn chính xác, cần làm rõ mốc thời gian...',
    description: 'Ghi chú phản hồi kiểm duyệt',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
