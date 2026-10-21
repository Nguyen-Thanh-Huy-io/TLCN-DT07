import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LessonStatus } from '@prisma/client';

export class ReviewLessonDto {
  @ApiProperty({
    enum: [LessonStatus.PUBLISHED, LessonStatus.DRAFT],
    example: LessonStatus.PUBLISHED,
    description:
      'Quyết định kiểm duyệt (PUBLISHED: Cho phép xuất bản, DRAFT: Trả về bản nháp để sửa lại)',
  })
  @IsEnum(LessonStatus)
  @IsNotEmpty({ message: 'Trạng thái duyệt không được để trống' })
  status: LessonStatus;

  @ApiPropertyOptional({
    example:
      'Nội dung thiếu nguồn trích dẫn chính xác, cần làm rõ mốc thời gian...',
    description: 'Ghi chú phản hồi kiểm duyệt',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
