import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';

export class CreateCurriculumTrackDto {
  @ApiProperty({
    description: 'Tên mạch tiến trình cốt lõi',
    example: 'Tiến trình Lịch sử Việt Nam: Từ Dựng nước đến Đại Việt',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả tổng quan về mạch tiến trình' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ảnh bìa mạch tiến trình' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị mạch', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    enum: ContentStatus,
    default: ContentStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateCurriculumTrackDto extends PartialType(
  CreateCurriculumTrackDto,
) {}
