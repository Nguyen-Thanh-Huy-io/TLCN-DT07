import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';
import { CreateOptionDto } from './create-option.dto';
import { QUIZ_CONSTANTS } from '../constants/quiz.constant';

export class CreateQuestionDto {
  @ApiProperty({
    example: 'Chiến thắng Bạch Đằng của Ngô Quyền diễn ra vào năm nào?',
    description: 'Nội dung câu hỏi',
  })
  @IsString({ message: 'Nội dung câu hỏi phải là chuỗi' })
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  questionText: string;

  @ApiPropertyOptional({
    example: 'Năm 938, Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng, chấm dứt hơn 1000 năm Bắc thuộc.',
    description: 'Lời giải thích chi tiết đáp án',
  })
  @IsOptional()
  @IsString({ message: 'Lời giải thích phải là chuỗi' })
  explanation?: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
    description: 'Loại câu hỏi (MULTIPLE_CHOICE, MULTIPLE_SELECT, TRUE_FALSE)',
    default: QuestionType.MULTIPLE_CHOICE,
  })
  @IsEnum(QuestionType, { message: 'Loại câu hỏi không hợp lệ' })
  type: QuestionType;

  @ApiPropertyOptional({
    example: 1,
    description: 'Số điểm của câu hỏi',
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Điểm câu hỏi phải là số nguyên' })
  @Min(1, { message: 'Điểm câu hỏi tối thiểu là 1' })
  points?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị câu hỏi',
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'displayOrder phải là số nguyên' })
  @Min(0, { message: 'displayOrder không được nhỏ hơn 0' })
  displayOrder?: number;

  @ApiProperty({
    type: [CreateOptionDto],
    description: 'Danh sách các đáp án lựa chọn',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @ArrayMinSize(QUIZ_CONSTANTS.MIN_OPTIONS_PER_QUESTION, {
    message: `Câu hỏi phải có ít nhất ${QUIZ_CONSTANTS.MIN_OPTIONS_PER_QUESTION} đáp án`,
  })
  options: CreateOptionDto[];
}
