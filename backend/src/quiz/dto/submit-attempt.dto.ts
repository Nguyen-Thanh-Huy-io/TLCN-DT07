import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitQuestionAnswerDto {
  @ApiProperty({
    example: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    description: 'UUID của câu hỏi',
  })
  @IsUUID('4', { message: 'questionId phải là UUID hợp lệ' })
  questionId: string;

  @ApiProperty({
    example: ['e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'],
    description: 'Danh sách các UUID của đáp án đã chọn',
    type: [String],
  })
  @IsArray({ message: 'selectedOptionIds phải là một mảng chuỗi UUID' })
  @IsUUID('4', { each: true, message: 'Mỗi optionId phải là UUID hợp lệ' })
  selectedOptionIds: string[];
}

export class SubmitAttemptDto {
  @ApiProperty({
    type: [SubmitQuestionAnswerDto],
    description: 'Danh sách câu trả lời của người làm bài',
  })
  @IsArray({ message: 'answers phải là một mảng câu trả lời' })
  @ValidateNested({ each: true })
  @Type(() => SubmitQuestionAnswerDto)
  @ArrayMinSize(1, { message: 'Bài nộp phải có ít nhất 1 câu trả lời' })
  answers: SubmitQuestionAnswerDto[];
}
