import {
  IsArray,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddLessonsToChapterDto {
  @ApiProperty({
    description: 'Danh sách ID bài học từ thư viện muốn gom vào chương',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  lessonIds: string[];
}

export class ReorderItemDto {
  @ApiProperty({ description: 'ID bài học' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiProperty({ description: 'Thứ tự mới trong chương', example: 1 })
  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class ReorderChapterLessonsDto {
  @ApiProperty({
    description: 'Danh sách thứ tự bài học mới sau khi kéo thả',
    type: [ReorderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}

export class ChapterQuizItemInputDto {
  @ApiProperty({ description: 'ID đề kiểm tra từ Ngân hàng đề' })
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @ApiPropertyOptional({
    description: 'Ngưỡng điểm đạt (%) riêng cho chương này (0 - 100)',
    example: 70,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passScore?: number | null;

  @ApiPropertyOptional({
    description:
      'Bắt buộc vượt qua để mở khóa chương tiếp theo khi học tuần tự',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class SetChapterQuizzesDto {
  @ApiProperty({
    description:
      'Danh sách đề kiểm tra gắn vào chương theo đúng thứ tự hiển thị',
    type: [ChapterQuizItemInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterQuizItemInputDto)
  items: ChapterQuizItemInputDto[];
}
