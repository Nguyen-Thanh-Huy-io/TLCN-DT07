import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRevisionDto {
  @ApiPropertyOptional({
    example: 'Sửa lại năm theo Đại Việt sử ký toàn thư.',
    description: 'Ghi chú khi duyệt; bắt buộc khi từ chối',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
