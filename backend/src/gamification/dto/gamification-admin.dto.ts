import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AchievementMetricType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  ALLOWED_ACHIEVEMENT_ICONS,
  AdminLearnerSortField,
} from '../gamification.constant';

export class CreateAchievementDto {
  @ApiPropertyOptional({ example: 'MINDMAP_CREATOR' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Mã huy hiệu chỉ gồm chữ in hoa, số và dấu gạch dưới (_).',
  })
  code?: string;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MinLength(4)
  @MaxLength(300)
  description!: string;

  @ApiPropertyOptional({ enum: ALLOWED_ACHIEVEMENT_ICONS, default: 'Award' })
  @IsOptional()
  @IsIn(ALLOWED_ACHIEVEMENT_ICONS)
  iconKey?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @ApiProperty({ enum: AchievementMetricType })
  @IsEnum(AchievementMetricType)
  metricType!: AchievementMetricType;

  @ApiProperty({ minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  threshold!: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  xpReward?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 999, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAchievementDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ enum: ALLOWED_ACHIEVEMENT_ICONS })
  @IsOptional()
  @IsIn(ALLOWED_ACHIEVEMENT_ICONS)
  iconKey?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @ApiPropertyOptional({ enum: AchievementMetricType })
  @IsOptional()
  @IsEnum(AchievementMetricType)
  metricType?: AchievementMetricType;

  @ApiPropertyOptional({ minimum: 1, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  threshold?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  xpReward?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 999 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryAdminLearnersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @ApiPropertyOptional({
    enum: AdminLearnerSortField,
    default: AdminLearnerSortField.XP,
  })
  @IsOptional()
  @IsEnum(AdminLearnerSortField)
  sortBy?: AdminLearnerSortField;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
