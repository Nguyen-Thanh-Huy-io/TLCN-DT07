import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttemptStatus } from '@prisma/client';

export class AttemptAnswerDetailDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  questionId: string;

  @ApiProperty({
    example: 'Chiến thắng Bạch Đằng của Ngô Quyền diễn ra vào năm nào?',
  })
  questionText: string;

  @ApiProperty({ example: ['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'] })
  selectedOptionIds: string[];

  @ApiProperty({ example: ['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'] })
  correctOptionIds: string[];

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: 1 })
  earnedPoints: number;

  @ApiProperty({ example: 1 })
  maxPoints: number;

  @ApiPropertyOptional({
    example: 'Năm 938, Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng.',
  })
  explanation?: string | null;
}

export class AttemptResultDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  attemptId: string;

  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  quizId: string;

  @ApiProperty({
    example: 'Trắc nghiệm củng cố kiến thức: Chiến thắng Bạch Đằng',
  })
  quizTitle: string;

  @ApiProperty({ example: 80, description: 'Phần trăm điểm đạt được (0-100%)' })
  score: number;

  @ApiProperty({ example: 10 })
  totalPoints: number;

  @ApiProperty({ example: 8 })
  earnedPoints: number;

  @ApiProperty({ example: 8 })
  correctAnswersCount: number;

  @ApiProperty({ example: 10 })
  totalQuestionsCount: number;

  @ApiProperty({ example: true })
  passed: boolean;

  @ApiProperty({ example: 50 })
  earnedXp: number;

  @ApiProperty({ enum: AttemptStatus, example: AttemptStatus.COMPLETED })
  status: AttemptStatus;

  @ApiProperty({ example: '2026-09-27T07:00:00.000Z' })
  startedAt: Date;

  @ApiPropertyOptional({ example: '2026-09-27T07:10:00.000Z' })
  completedAt?: Date | null;

  @ApiPropertyOptional({ type: [AttemptAnswerDetailDto] })
  answers?: AttemptAnswerDetailDto[];
}
