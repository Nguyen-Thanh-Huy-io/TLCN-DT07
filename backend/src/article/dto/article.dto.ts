import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ContentStatus, DatePrecision } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** 1 liên kết bài này → bài khác. Không có mã loại: ý nghĩa suy ra từ chuyên mục 2 bài. */
export class ArticleLinkInputDto {
  @ApiProperty({ description: 'Bài viết được liên kết tới' })
  @IsUUID('4')
  targetId: string;

  @ApiPropertyOptional({ example: 'Chỉ huy', description: 'Nhãn chữ tự do, tuỳ chọn' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null;
}

export class CreateArticleDto {
  @ApiProperty({ example: 'Trần Hưng Đạo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'tran-hung-dao', description: 'Bỏ trống để tự sinh từ tiêu đề' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang' })
  slug?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string | null;

  @ApiPropertyOptional({ type: [String], description: 'Thay toàn bộ tag của bài viết' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  summary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverCaption?: string | null;

  @ApiPropertyOptional({ type: 'array', description: 'Mảng khối nội dung (Block Builder)' })
  @IsOptional()
  @IsArray()
  contentBlocks?: Record<string, unknown>[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Hồ sơ mô tả tùy chọn: { aliases, region, sources, person, site, event } — xem article/article-metadata.ts',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    type: [ArticleLinkInputDto],
    description: 'Thay TOÀN BỘ liên kết do bài này khai báo; thứ tự = vị trí trong mảng',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleLinkInputDto)
  links?: ArticleLinkInputDto[];

  @ApiPropertyOptional({ example: '1228? – 1300', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  dateText?: string | null;

  @ApiPropertyOptional({ example: 1228, nullable: true, description: 'Năm âm = TCN, không có năm 0' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startYear?: number | null;

  @ApiPropertyOptional({ example: 1300, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endYear?: number | null;

  @ApiPropertyOptional({ enum: DatePrecision, nullable: true })
  @IsOptional()
  @IsEnum(DatePrecision)
  datePrecision?: DatePrecision | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {}

export class QueryArticleDto {
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

  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề / tóm tắt' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  tagId?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ description: 'Chỉ bài nổi bật' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: ['updated', 'year', 'title'], default: 'updated' })
  @IsOptional()
  @IsString()
  sort?: 'updated' | 'year' | 'title';
}
