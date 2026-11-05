import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class TimelineNodeInputDto {
  @ApiPropertyOptional({ nullable: true, description: 'Bài viết chi tiết của mốc' })
  @IsOptional()
  @IsUUID('4')
  articleId?: string | null;

  @ApiProperty({ example: 'Trận Bạch Đằng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 'Tháng 4/1288', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  dateText?: string | null;

  @ApiPropertyOptional({ example: 1288, nullable: true, description: 'Năm âm = TCN, không có năm 0' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  day?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endYear?: number | null;
}

export class CreateTimelineDto {
  @ApiPropertyOptional({ nullable: true, description: 'Chủ đề / Thời kỳ lịch sử' })
  @IsOptional()
  @IsUUID('4')
  topicId?: string | null;

  @ApiProperty({ example: 'Nhà Trần và ba lần kháng chiến chống Nguyên Mông' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Bỏ trống để tự sinh từ tiêu đề' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    type: [TimelineNodeInputDto],
    description: 'Thay TOÀN BỘ mốc; thứ tự hiển thị = vị trí trong mảng',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineNodeInputDto)
  nodes?: TimelineNodeInputDto[];
}

export class UpdateTimelineDto extends PartialType(CreateTimelineDto) {}

export class QueryTimelineDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Lọc theo chủ đề / thời kỳ' })
  @IsOptional()
  @IsUUID('4')
  topicId?: string;
}
