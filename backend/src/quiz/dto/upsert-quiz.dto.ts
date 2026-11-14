import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpsertQuizDto {
  @ApiPropertyOptional({
    example: 'Câu hỏi ôn tập',
    description: 'Tiêu đề đề ôn tập (tùy chọn)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 70,
    description: '% câu đúng tối thiểu để coi là "đạt" (tùy chọn)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScorePercent?: number;

  @ApiProperty({
    description:
      'Câu hỏi của đề theo thứ tự (mỗi phần tử tự khai báo `type`, validate ở service). `id` trùng câu trong Ngân hàng thì cập nhật câu đó, id khác thì tạo câu mới vào Ngân hàng.',
    type: [Object],
  })
  @IsArray()
  questions: unknown[];
}
