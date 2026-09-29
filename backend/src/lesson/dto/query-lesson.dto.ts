import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus, DifficultyLevel, HistoricalField, HistoricalGenre } from '@prisma/client';

export class QueryLessonDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Lọc bài học theo ID của Chủ đề (Topic)',
  })
  @IsUUID('4')
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({
    enum: HistoricalGenre,
    description: 'Lọc theo thể loại sử học (DOCUMENTED_HISTORY, FOLKLORE_MYTHOLOGY...)',
  })
  @IsEnum(HistoricalGenre)
  @IsOptional()
  genre?: HistoricalGenre;

  @ApiPropertyOptional({
    enum: HistoricalField,
    description: 'Lọc theo lĩnh vực lịch sử (MILITARY_WAR, POLITICAL_DIPLOMACY...)',
  })
  @IsEnum(HistoricalField)
  @IsOptional()
  field?: HistoricalField;

  @ApiPropertyOptional({
    example: 938,
    description: 'Lọc bài học diễn ra quanh năm này',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    enum: ContentStatus,
    description: 'Lọc theo trạng thái xuất bản (PUBLISHED, DRAFT...)',
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({
    enum: DifficultyLevel,
    description: 'Lọc theo độ khó (EASY, MEDIUM, HARD)',
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({
    example: 'Bạch Đằng',
    description: 'Tìm kiếm theo tiêu đề hoặc nội dung bài học',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng mục trên mỗi trang (tối đa 100)',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}
