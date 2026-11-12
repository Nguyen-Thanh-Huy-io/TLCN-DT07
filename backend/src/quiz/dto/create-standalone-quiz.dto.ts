import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateStandaloneQuizDto {
  @ApiProperty({
    example: 'Đề kiểm tra 15 phút: Chiến thắng Bạch Đằng 938',
    description: 'Tiêu đề đề thi/quiz',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example:
      'Đề đánh giá mức độ ghi nhớ và thông hiểu kiến thức lịch sử thế kỷ X',
    description: 'Mô tả tóm tắt',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'uuid-bai-hoc',
    description: 'UUID bài học liên kết (tùy chọn để xem qua)',
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID các Chủ đề lịch sử mà đề thi này bao phủ',
    type: [String],
    example: ['uuid-topic-1', 'uuid-topic-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicIds?: string[];

  @ApiPropertyOptional({
    example: 15,
    description: 'Thời gian làm bài tính bằng phút (mặc định 15)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  timeLimitMinutes?: number;

  @ApiPropertyOptional({
    example: 80,
    description: 'Tỷ lệ % câu đúng để đạt bài kiểm tra (mặc định 80)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScorePercent?: number;

  @ApiProperty({
    description:
      'Danh sách các câu hỏi trong đề (được tổng hợp từ Ngân hàng câu hỏi hoặc tạo mới)',
    type: [Object],
  })
  @IsArray()
  questions: unknown[];
}

export class UpdateStandaloneQuizDto {
  @ApiPropertyOptional({
    example: 'Đề kiểm tra 15 phút: Chiến thắng Bạch Đằng 938',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Mô tả đề thi cập nhật' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-bai-hoc' })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID các Chủ đề lịch sử mà đề thi này bao phủ',
    type: [String],
    example: ['uuid-topic-1', 'uuid-topic-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicIds?: string[];

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  timeLimitMinutes?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScorePercent?: number;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  questions?: unknown[];
}
