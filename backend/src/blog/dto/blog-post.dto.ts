import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const BLOG_POST_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'] as const;
type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number];

const POST_TYPES = ['QUICK_POST', 'LONG_FORM'] as const;
export type PostTypeValue = (typeof POST_TYPES)[number];

export class ListBlogPostsQueryDto {
  @ApiPropertyOptional({ enum: POST_TYPES, description: 'Lọc theo loại bài (QUICK_POST | LONG_FORM)' })
  @IsOptional()
  @IsEnum(POST_TYPES as any)
  type?: PostTypeValue;

  @ApiPropertyOptional({ enum: ['latest', 'trending'], default: 'latest', description: 'Sắp xếp mới nhất hoặc sôi nổi (trending)' })
  @IsOptional()
  @IsString()
  sort?: 'latest' | 'trending';

  @ApiPropertyOptional({ description: 'ID bài viết cuối của trang trước (dùng cho cuộn vô hạn)' })
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

  @ApiPropertyOptional({ description: 'Chỉ lấy bài từ những tài khoản đang theo dõi (true/false)' })
  @IsOptional()
  @IsString()
  followingOnly?: string;
}

export class CreateBlogPostDto {
  @ApiPropertyOptional({ enum: POST_TYPES, default: 'QUICK_POST' })
  @IsOptional()
  @IsEnum(POST_TYPES as any)
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
  excerpt?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: 'array', description: 'Khối nội dung blog dạng JSON / block content' })
  @IsOptional()
  @IsArray()
  contentBlocks?: Record<string, any>[] | Record<string, any> | null;

  @ApiPropertyOptional({ enum: BLOG_POST_STATUSES, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(BLOG_POST_STATUSES as any)
  status?: BlogPostStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsString()
  publishedAt?: string | Date | null;

  @ApiPropertyOptional({ description: 'ID người tạo bài' })
  @IsOptional()
  @IsUUID('4')
  authorId?: string;
}

export class ReviewBlogPostDto {
  @ApiProperty({ enum: BLOG_POST_STATUSES })
  @IsEnum(BLOG_POST_STATUSES as any)
  status: BlogPostStatus;

  @ApiPropertyOptional({ example: 'Nội dung chưa đủ bằng chứng' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UpdateBlogPostDto {
  @ApiPropertyOptional({ enum: POST_TYPES })
  @IsOptional()
  @IsEnum(POST_TYPES as any)
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
  excerpt?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ type: 'array' })
  @IsOptional()
  @IsArray()
  contentBlocks?: Record<string, any>[] | Record<string, any> | null;

  @ApiPropertyOptional({ enum: BLOG_POST_STATUSES })
  @IsOptional()
  @IsEnum(BLOG_POST_STATUSES as any)
  status?: BlogPostStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsString()
  publishedAt?: string | Date | null;
}
