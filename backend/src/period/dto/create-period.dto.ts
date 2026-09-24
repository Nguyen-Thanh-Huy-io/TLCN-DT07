import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '@prisma/client';

export class CreatePeriodDto {
  @ApiProperty({
    example: 'Thời kỳ Bắc thuộc',
    description: 'Tên giai đoạn lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Việt Nam',
    description: 'Khu vực hoặc tỉnh thành liên quan',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  region?: string;

  @ApiProperty({
    example: -111,
    description: 'Năm bắt đầu (Số nguyên, có thể âm với TCN)',
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  startYear: number;

  @ApiPropertyOptional({
    example: 938,
    description: 'Năm kết thúc (null nếu còn tiếp diễn)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  endYear?: number;

  @ApiPropertyOptional({
    example: 'Giai đoạn hơn 1000 năm nhân dân ta chống lại ách đô hộ của phương Bắc...',
    description: 'Mô tả chi tiết về giai đoạn',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/bac-thuoc.jpg',
    description: 'URL ảnh đại diện/cover cho giai đoạn',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị trên danh sách',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
    description: 'Trạng thái phát hành của giai đoạn',
    default: ContentStatus.DRAFT,
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus = ContentStatus.DRAFT;
}
