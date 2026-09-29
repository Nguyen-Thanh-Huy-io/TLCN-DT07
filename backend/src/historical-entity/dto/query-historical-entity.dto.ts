import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '@prisma/client';

export class QueryHistoricalEntityDto {
  @ApiPropertyOptional({
    enum: EntityType,
    description: 'Lọc theo loại thực thể (PERSON, POLITY_STATE...)',
  })
  @IsEnum(EntityType)
  @IsOptional()
  type?: EntityType;

  @ApiPropertyOptional({
    example: 'Đại Việt',
    description: 'Lọc theo quốc tịch / xuất xứ',
  })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({
    example: 938,
    description: 'Lọc thực thể tồn tại hoặc sinh sống quanh năm này',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    example: 'Ngô Quyền',
    description: 'Tìm kiếm theo tên, tên gốc hoặc mô tả',
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
