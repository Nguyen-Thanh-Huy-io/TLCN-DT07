import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QuizQuestionType } from '../types/quiz-question.types';

export class QueryQuestionDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: QuizQuestionType, description: 'Loại câu hỏi' })
  @IsEnum(QuizQuestionType)
  @IsOptional()
  type?: QuizQuestionType;

  @ApiPropertyOptional({ description: 'Mức độ khó' })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'UUID bài học' })
  @IsString()
  @IsOptional()
  lessonId?: string;

  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng / trang', default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}
