import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus, LearningPathType } from '@prisma/client';

export class QueryTopicDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Lọc chủ đề theo ID của Giai đoạn lịch sử (UUID)',
  })
  @IsUUID('4')
  @IsOptional()
  periodId?: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    description: 'Lọc chủ đề con theo ID của Chủ đề cha (UUID)',
  })
  @IsUUID('4')
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Chỉ lấy các chủ đề gốc (không có chủ đề cha)',
  })
  @IsOptional()
  isRootOnly?: boolean;

  @ApiPropertyOptional({
    enum: LearningPathType,
    description: 'Lọc theo loại tiến trình học (CHRONOLOGICAL, THEMATIC, MYTHOLOGICAL)',
  })
  @IsEnum(LearningPathType)
  @IsOptional()
  pathType?: LearningPathType;

  @ApiPropertyOptional({
    enum: ContentStatus,
    description: 'Lọc theo trạng thái phát hành (PUBLISHED, DRAFT...)',
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({
    example: 'Hai Bà Trưng',
    description: 'Tìm kiếm theo tên hoặc mô tả chủ đề',
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
