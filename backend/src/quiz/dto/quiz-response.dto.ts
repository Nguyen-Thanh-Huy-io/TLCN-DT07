import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuizResponseDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' })
  id: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' })
  lessonId: string;

  @ApiPropertyOptional({ example: 'Câu hỏi ôn tập' })
  title?: string | null;

  @ApiPropertyOptional({ example: 70 })
  passingScorePercent?: number | null;

  @ApiProperty({ type: [Object] })
  questions: unknown[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
