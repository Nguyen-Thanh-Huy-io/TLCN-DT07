import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class ReviewQuizDto {
  @ApiProperty({
    enum: [ContentStatus.PUBLISHED, ContentStatus.REJECTED],
    example: ContentStatus.PUBLISHED,
    description: 'Trạng thái kiểm duyệt (PUBLISHED: Duyệt, REJECTED: Từ chối)',
  })
  @IsEnum(ContentStatus, { message: 'Trạng thái duyệt không hợp lệ' })
  status: ContentStatus;

  @ApiPropertyOptional({
    example: 'Nội dung câu hỏi chưa rõ ràng về mốc thời gian lịch sử.',
    description: 'Lý do từ chối (bắt buộc khi status là REJECTED)',
  })
  @IsOptional()
  @IsString({ message: 'Lý do từ chối phải là chuỗi' })
  rejectionReason?: string;
}
