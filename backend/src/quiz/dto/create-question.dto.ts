import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DifficultyLevel } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DEFAULT_QUESTION_POINTS } from '../quiz.constant';
import { QuizQuestionType } from '../types/quiz-question.types';

export class CreateQuestionDto {
  @ApiProperty({ enum: QuizQuestionType, description: 'Loại câu hỏi' })
  @IsEnum(QuizQuestionType)
  @IsNotEmpty()
  type: QuizQuestionType;

  @ApiProperty({ description: 'Nội dung câu hỏi / câu dẫn' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ description: 'Giải thích đáp án' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    enum: DifficultyLevel,
    description: 'Mức độ khó',
    default: DifficultyLevel.MEDIUM,
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Điểm số',
    default: DEFAULT_QUESTION_POINTS,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  points?: number;

  @ApiProperty({
    description:
      'Dữ liệu chuyên biệt theo từng loại (options, items, pairs, etc.)',
  })
  @IsNotEmpty()
  data: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Danh sách UUID các bài học liên kết',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lessonIds?: string[];

  @ApiPropertyOptional({
    description: 'Danh sách UUID các chuyên đề liên kết',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  topicIds?: string[];
}

export class UpdateQuestionDto extends CreateQuestionDto {}
