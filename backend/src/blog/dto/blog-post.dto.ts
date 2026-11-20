import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, PostType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export type BlogPostStatus = ContentStatus;
export type PostTypeValue = PostType;

export class ListBlogPostsQueryDto {
  @ApiPropertyOptional({
    enum: PostType,
    description: 'Lọc theo loại bài (QUICK_POST | LONG_FORM)',
  })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostTypeValue;

  @ApiPropertyOptional({
    enum: ['latest', 'trending'],
    default: 'latest',
    description: 'Sắp xếp mới nhất hoặc sôi nổi (trending)',
  })
  @IsOptional()
  @IsString()
  sort?: 'latest' | 'trending';

  @ApiPropertyOptional({
    description: 'ID bài viết cuối của trang trước (dùng cho cuộn vô hạn)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Số lượng bài mỗi trang' })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Lọc theo username hoặc ID tác giả' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({
    description: 'Chỉ lấy bài từ những tài khoản đang theo dõi (true/false)',
  })
  @IsOptional()
  @IsString()
  followingOnly?: string;
}

export const BLOG_REVIEW_DEFAULT_LIMIT = 50;
export const BLOG_REVIEW_MAX_LIMIT = 100;

export class ListBlogReviewQueryDto {
  @ApiPropertyOptional({
    enum: ContentStatus,
    description: 'Lọc theo trạng thái; bỏ trống để lấy mọi trạng thái',
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: BlogPostStatus;

  @ApiPropertyOptional({
    default: BLOG_REVIEW_DEFAULT_LIMIT,
    maximum: BLOG_REVIEW_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(BLOG_REVIEW_MAX_LIMIT)
  limit?: number;
}

export class CreateBlogPostDto {
  @ApiPropertyOptional({ enum: PostType, default: PostType.QUICK_POST })
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostTypeValue;

  @ApiProperty({ example: 'Cổng La Mã và không gian quyền lực' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'cong-la-ma-va-khong-gian-quyen-luc' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ example: 'Từ cổng chiến thắng đến...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  excerpt?: string;

  @ApiPropertyOptional({ example: `https://${'example.com/cover.jpg'}` })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({
    type: 'array',
    description: 'Khối nội dung blog dạng JSON / block content',
  })
  @IsOptional()
  @IsArray()
  contentBlocks?: Record<string, unknown>[] | Record<string, unknown> | null;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: BlogPostStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | Date | null;
}

export class ReviewBlogPostDto {
  @ApiProperty({ enum: ContentStatus })
  @IsEnum(ContentStatus)
  status: BlogPostStatus;

  @ApiPropertyOptional({ example: 'Nội dung chưa đủ bằng chứng' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UpdateBlogPostDto {
  @ApiPropertyOptional({ enum: PostType })
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostTypeValue;

  @ApiPropertyOptional({ example: 'Tiêu đề mới' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'tieu-de-moi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({ example: 'Mô tả mới' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  excerpt?: string;

  @ApiPropertyOptional({ example: `https://${'example.com/cover.jpg'}` })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: 'array' })
  @IsOptional()
  @IsArray()
  contentBlocks?: Record<string, unknown>[] | Record<string, unknown> | null;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: BlogPostStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | Date | null;
}
