import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GoalPeriod,
  GoalPresetKey,
  GoalStatus,
  GoalTargetType,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { GAMIFICATION_LIMITS } from '../gamification.constant';

export class CreateGoalDto {
  @ApiProperty({ enum: GoalPresetKey, default: GoalPresetKey.PRESET_3X })
  @IsEnum(GoalPresetKey)
  presetKey!: GoalPresetKey;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    enum: GoalTargetType,
    default: GoalTargetType.STUDY_DAYS,
  })
  @IsOptional()
  @IsEnum(GoalTargetType)
  targetType?: GoalTargetType;

  @ApiPropertyOptional({ enum: GoalPeriod, default: GoalPeriod.WEEKLY })
  @IsOptional()
  @IsEnum(GoalPeriod)
  period?: GoalPeriod;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(GAMIFICATION_LIMITS.MIN_GOAL_TARGET)
  @Max(GAMIFICATION_LIMITS.MAX_GOAL_TARGET)
  targetValue?: number;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;
}

export class UpdateGoalStatusDto {
  @ApiProperty({ enum: GoalStatus })
  @IsEnum(GoalStatus)
  status!: GoalStatus;
}
