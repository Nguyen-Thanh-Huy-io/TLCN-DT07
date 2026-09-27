import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';
import { QUIZ_CONSTANTS } from '../constants/quiz.constant';

export class CreateQuizDto {
  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'UUID của bài học liên kết (tùy chọn)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'lessonId phải là UUID hợp lệ' })
  lessonId?: string;

  @ApiPropertyOptional({
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'UUID của chủ đề liên kết (tùy chọn)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'topicId phải là UUID hợp lệ' })
  topicId?: string;

  @ApiProperty({
    example: 'Trắc nghiệm củng cố kiến thức: Chiến thắng Bạch Đằng',
    description: 'Tiêu đề của bài kiểm tra Quiz',
  })
  @IsString({ message: 'Tiêu đề bài kiểm tra phải là chuỗi' })
  @IsNotEmpty({ message: 'Tiêu đề bài kiểm tra không được để trống' })
  title: string;

  @ApiPropertyOptional({
    example: 'Bài kiểm tra gồm 10 câu hỏi nhằm đánh giá mức độ hiểu bài về trận Bạch Đằng năm 938.',
    description: 'Mô tả bài kiểm tra',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả bài kiểm tra phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({
    example: 70,
    description: 'Phần trăm điểm để vượt qua bài kiểm tra (0-100%)',
    default: QUIZ_CONSTANTS.DEFAULT_PASSING_SCORE,
  })
  @IsOptional()
  @IsInt({ message: 'passingScore phải là số nguyên' })
  @Min(0, { message: 'passingScore tối thiểu là 0' })
  @Max(100, { message: 'passingScore tối đa là 100' })
  passingScore?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Thời gian giới hạn làm bài (phút). Bỏ trống nếu không giới hạn',
  })
  @IsOptional()
  @IsInt({ message: 'timeLimitMinutes phải là số nguyên' })
  @Min(1, { message: 'timeLimitMinutes tối thiểu là 1 phút' })
  timeLimitMinutes?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Số điểm kinh nghiệm (XP) nhận được khi vượt qua bài kiểm tra',
    default: QUIZ_CONSTANTS.DEFAULT_XP_REWARD,
  })
  @IsOptional()
  @IsInt({ message: 'xpReward phải là số nguyên' })
  @Min(0, { message: 'xpReward không được nhỏ hơn 0' })
  xpReward?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Số lần tối đa người học được làm bài. Bỏ trống nếu không giới hạn',
  })
  @IsOptional()
  @IsInt({ message: 'maxAttempts phải là số nguyên' })
  @Min(1, { message: 'maxAttempts tối thiểu là 1' })
  maxAttempts?: number;

  @ApiPropertyOptional({
    type: [CreateQuestionDto],
    description: 'Danh sách câu hỏi khởi tạo kèm theo Quiz',
  })
  @IsOptional()
  @IsArray({ message: 'questions phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
