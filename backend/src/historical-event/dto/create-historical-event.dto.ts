import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHistoricalEventDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của Chủ đề lịch sử (Topic) chứa sự kiện này (UUID)',
  })
  @IsUUID('4', { message: 'topicId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'topicId không được để trống' })
  topicId: string;

  @ApiProperty({
    example: 'Trận Bạch Đằng năm 938',
    description: 'Tên sự kiện lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tên sự kiện không được để trống' })
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 938,
    description: 'Năm bắt đầu diễn ra sự kiện (Số nguyên, có thể âm với TCN)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Năm bắt đầu diễn ra sự kiện phải là số nguyên' })
  @IsOptional()
  startYear?: number;

  @ApiPropertyOptional({
    example: 938,
    description: 'Năm kết thúc sự kiện (Số nguyên, có thể âm với TCN)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Năm kết thúc sự kiện phải là số nguyên' })
  @IsOptional()
  endYear?: number;

  @ApiPropertyOptional({
    example: 'Mùa thu năm 938',
    description: 'Ghi chú ngày tháng chi tiết',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  eventDateNote?: string;

  @ApiPropertyOptional({
    example: 'Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng, chấm dứt 1000 năm Bắc thuộc...',
    description: 'Mô tả chi tiết diễn biến sự kiện',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Sông Bạch Đằng, Quảng Ninh',
    description: 'Ghi chú vắn tắt về địa danh xảy ra sự kiện',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  locationNote?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của Địa điểm lịch sử liên kết (UUID)',
  })
  @IsUUID('4', { message: 'locationId phải là UUID hợp lệ' })
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number = 0;
}
