import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus, DatePrecision } from '@prisma/client';

export class CreatePeriodDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của thời kỳ cha (nếu đây là một giai đoạn con)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'parentId phải là UUID hợp lệ' })
  parentId?: string;

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
    example: '(thế kỷ VII TCN - thế kỷ II TCN)',
    description:
      'Nhãn niên đại hiển thị trên landing. Bỏ trống thì tự sinh từ startYear/endYear',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  timeLabel?: string;

  @ApiPropertyOptional({
    enum: DatePrecision,
    example: DatePrecision.EXACT_YEAR,
    description: 'Độ chính xác niên đại (EXACT_YEAR, APPROXIMATE, CENTURY...)',
  })
  @IsOptional()
  @IsEnum(DatePrecision)
  datePrecision?: DatePrecision;

  @ApiPropertyOptional({
    example: 'Việt Nam',
    description: 'Khu vực hoặc tỉnh thành liên quan',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({
    example: -111,
    description: 'Năm bắt đầu (Số nguyên, có thể âm với TCN, tùy chọn)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  startYear?: number;

  @ApiPropertyOptional({
    example: 938,
    description: 'Năm kết thúc (null nếu còn tiếp diễn)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  endYear?: number;

  @ApiPropertyOptional({
    example:
      'Giai đoạn hơn 1000 năm nhân dân ta chống lại ách đô hộ của phương Bắc...',
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
