import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LearningPathType, ContentStatus } from '@prisma/client';

export class CreateLearningPathDto {
  @ApiProperty({
    description: 'Tên lộ trình học',
    example: 'Lịch sử Việt Nam 1945 - 1975',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả tóm tắt lộ trình' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa lộ trình' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    enum: LearningPathType,
    default: LearningPathType.CHRONOLOGICAL,
  })
  @IsOptional()
  @IsEnum(LearningPathType)
  pathType?: LearningPathType;

  @ApiPropertyOptional({
    description: 'Bắt buộc học tuần tự hay tự do',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSequential?: boolean;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description: 'ID mạch tiến trình (CurriculumTrack) mà chặng này thuộc về',
  })
  @IsOptional()
  @IsString()
  trackId?: string | null;

  @ApiPropertyOptional({
    description: 'Thứ tự chặng trong mạch tiến trình',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stageOrder?: number;

  @ApiPropertyOptional({
    description:
      'ID lộ trình tiên quyết cần hoàn thành trước khi mở lộ trình này',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  prerequisitePathId?: string | null;

  @ApiPropertyOptional({
    description:
      'ID đề thi cuối chặng (Stage Exam) bắt buộc đậu để mở chặng tiếp theo',
  })
  @IsOptional()
  @IsString()
  stageExamQuizId?: string | null;

  @ApiPropertyOptional({
    description: 'Ngưỡng điểm đậu (%) cho bài kiểm tra cuối chặng (0 - 100)',
    example: 80,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stageExamPassScore?: number | null;
}

/** PATCH/PUT một phần (vd. chỉ đổi `status`) — không bắt gửi lại `title`. */
export class UpdateLearningPathDto extends PartialType(CreateLearningPathDto) {}
