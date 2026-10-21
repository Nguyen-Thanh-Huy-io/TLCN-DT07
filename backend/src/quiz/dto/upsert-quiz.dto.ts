import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertQuizDto {
  @ApiPropertyOptional({ example: 'Câu hỏi ôn tập', description: 'Tiêu đề đề ôn tập (tùy chọn)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 70, description: '% câu đúng tối thiểu để coi là "đạt" (tùy chọn)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScorePercent?: number;

  @ApiProperty({
    description:
      'Mảng câu hỏi (mỗi phần tử tự khai báo `type`: MULTIPLE_CHOICE | TRUE_FALSE | ORDERING | MATCHING | FILL_IN_BLANK, validate chi tiết ở service)',
    type: [Object],
  })
  @IsArray()
  questions: unknown[];
}
