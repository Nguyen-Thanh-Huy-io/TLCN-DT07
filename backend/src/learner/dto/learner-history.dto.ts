import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  LEARNER_HISTORY_LIMITS,
  LearnerHistoryKind,
} from '../learner.constant';

export class LearnerHistoryQueryDto {
  @ApiPropertyOptional({
    enum: LearnerHistoryKind,
    description: 'Loại nhật ký học tập cần truy vấn',
  })
  @IsOptional()
  @IsEnum(LearnerHistoryKind)
  kind?: LearnerHistoryKind;

  @ApiPropertyOptional({
    description: 'Số trang (bắt đầu từ 1)',
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Số bản ghi mỗi trang (tối đa 50)',
    minimum: 1,
    maximum: LEARNER_HISTORY_LIMITS.MAX_LIMIT,
    example: LEARNER_HISTORY_LIMITS.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEARNER_HISTORY_LIMITS.MAX_LIMIT)
  limit?: number;
}
