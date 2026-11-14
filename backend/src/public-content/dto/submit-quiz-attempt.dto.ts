import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Điểm do server tự chấm từ `answers` — client không gửi điểm số hay kết quả đạt/không đạt. */
export class SubmitQuizAttemptDto {
  @ApiPropertyOptional({
    description: 'Tên người làm bài (nếu chưa đăng nhập)',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  learnerName?: string;

  @ApiProperty({
    description: 'Thời gian hoàn thành (tính bằng giây)',
    example: 245,
  })
  @IsInt()
  @Min(0)
  timeSpentSeconds: number;

  @ApiProperty({
    description:
      'Câu trả lời theo id câu hỏi: optionId | optionId[] | boolean | chuỗi | itemId[] | { leftId: rightId }',
    example: { q1: 'a', q2: true, q3: ['e1', 'e2'] },
  })
  @IsObject()
  answers: Record<string, unknown>;
}
