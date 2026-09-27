import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, QuestionType } from '@prisma/client';

export class OptionResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Năm 938' })
  optionText: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Chỉ hiển thị khi đã nộp bài hoặc dành cho tác giả/admin',
  })
  isCorrect?: boolean;

  @ApiProperty({ example: 1 })
  displayOrder: number;
}

export class QuestionResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({
    example: 'Chiến thắng Bạch Đằng của Ngô Quyền diễn ra vào năm nào?',
  })
  questionText: string;

  @ApiPropertyOptional({ example: 'Lời giải thích chi tiết' })
  explanation?: string | null;

  @ApiProperty({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE })
  type: QuestionType;

  @ApiProperty({ example: 1 })
  points: number;

  @ApiProperty({ example: 1 })
  displayOrder: number;

  @ApiProperty({ type: [OptionResponseDto] })
  options: OptionResponseDto[];
}

export class QuizResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  lessonId?: string | null;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' })
  topicId?: string | null;

  @ApiProperty({
    example: 'Trắc nghiệm củng cố kiến thức: Chiến thắng Bạch Đằng',
  })
  title: string;

  @ApiPropertyOptional({ example: 'Mô tả bài kiểm tra' })
  description?: string | null;

  @ApiProperty({ example: 70 })
  passingScore: number;

  @ApiPropertyOptional({ example: 15 })
  timeLimitMinutes?: number | null;

  @ApiProperty({ example: 50 })
  xpReward: number;

  @ApiPropertyOptional({ example: 3 })
  maxAttempts?: number | null;

  @ApiProperty({ enum: ContentStatus, example: ContentStatus.PUBLISHED })
  status: ContentStatus;

  @ApiProperty({ example: '2026-09-27T07:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-27T07:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [QuestionResponseDto] })
  questions?: QuestionResponseDto[];
}
