import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { QUIZ_LIST_MAX_LIMIT, QuizListStatus } from '../quiz.constant';

export class QueryQuizDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tiêu đề đề thi hoặc mô tả',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo UUID của Chủ đề / Chuyên đề' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({
    enum: QuizListStatus,
    description:
      'Lọc theo trạng thái đề: ACTIVE (đã có câu hỏi), DRAFT (chưa có), all',
  })
  @IsOptional()
  @IsEnum(QuizListStatus)
  status?: QuizListStatus;

  @ApiPropertyOptional({ description: 'Số trang (bắt đầu từ 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số bản ghi trên mỗi trang',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(QUIZ_LIST_MAX_LIMIT)
  limit?: number = 20;
}
