import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryHistoricalEventDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Lọc sự kiện theo ID của Chủ đề (Topic)',
  })
  @IsUUID('4')
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({
    example: 938,
    description: 'Lọc sự kiện theo năm diễn ra',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  eventYear?: number;

  @ApiPropertyOptional({
    example: 'Bạch Đằng',
    description: 'Lọc theo địa danh hoặc tên vị trí xảy ra sự kiện',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: 'Ngô Quyền',
    description: 'Tìm kiếm theo tên hoặc mô tả sự kiện',
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
