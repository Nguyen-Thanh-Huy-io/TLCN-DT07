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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LearningPathType, ContentStatus } from '@prisma/client';

export class CreateLearningPathDto {
  @ApiProperty({ description: 'Tên lộ trình học', example: 'Lịch sử Việt Nam 1945 - 1975' })
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

  @ApiPropertyOptional({ enum: LearningPathType, default: LearningPathType.CHRONOLOGICAL })
  @IsOptional()
  @IsEnum(LearningPathType)
  pathType?: LearningPathType;

  @ApiPropertyOptional({ description: 'Bắt buộc học tuần tự hay tự do', default: false })
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
}

export class UpdateLearningPathDto extends CreateLearningPathDto {}
