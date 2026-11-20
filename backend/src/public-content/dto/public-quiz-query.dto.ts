import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PUBLIC_QUIZ_LIST_MAX_LIMIT } from '../../quiz/quiz.constant';

export class PublicQuizQueryDto {
  @ApiPropertyOptional({ description: 'Chỉ lấy đề thuộc chủ đề này' })
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional({
    default: PUBLIC_QUIZ_LIST_MAX_LIMIT,
    maximum: PUBLIC_QUIZ_LIST_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PUBLIC_QUIZ_LIST_MAX_LIMIT)
  limit?: number;
}
