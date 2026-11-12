import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitQuizAttemptDto {
  @ApiPropertyOptional({
    description: 'Tên người làm bài (nếu chưa đăng nhập)',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  learnerName?: string;

  @ApiProperty({ description: 'Điểm số phần trăm (0 - 100)', example: 85 })
  @IsInt()
  @Min(0)
  scorePercent: number;

  @ApiProperty({ description: 'Số câu đúng', example: 4 })
  @IsInt()
  @Min(0)
  correctCount: number;

  @ApiProperty({ description: 'Tổng số câu hỏi', example: 5 })
  @IsInt()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({
    description: 'Thời gian hoàn thành (tính bằng giây)',
    example: 245,
  })
  @IsInt()
  @Min(0)
  timeSpentSeconds: number;

  @ApiPropertyOptional({ description: 'Trạng thái đạt chuẩn', example: true })
  @IsOptional()
  @IsBoolean()
  isPassed?: boolean;

  @ApiPropertyOptional({
    description: 'Chi tiết câu trả lời',
    example: [{ qIndex: 0, answer: 'A', isCorrect: true }],
  })
  @IsOptional()
  answers?: any;
}
