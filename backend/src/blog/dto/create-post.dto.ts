import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostType, PostStatus } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({ example: 'user-123', description: 'ID người tạo bài viết' })
  @IsNotEmpty({ message: 'authorId không được để trống' })
  @IsString({ message: 'authorId phải là chuỗi' })
  authorId: string;

  @ApiPropertyOptional({
    enum: PostType,
    example: PostType.BLOG,
    description: 'Loại bài viết',
  })
  @IsOptional()
  @IsEnum(PostType, { message: 'type không hợp lệ' })
  type?: PostType;

  @ApiPropertyOptional({
    enum: PostStatus,
    example: PostStatus.DRAFT,
    description: 'Trạng thái ban đầu',
  })
  @IsOptional()
  @IsEnum(PostStatus, { message: 'status không hợp lệ' })
  status?: PostStatus;

  @ApiProperty({
    example: 'Nghiên cứu về chiến dịch Điện Biên Phủ',
    description: 'Tiêu đề bài viết',
  })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MaxLength(300, { message: 'Tiêu đề tối đa 300 ký tự' })
  title: string;

  @ApiPropertyOptional({
    example: 'nghien-cuu-chien-dich-dien-bien-phu',
    description: 'Slug tùy chỉnh, nếu không truyền sẽ tự sinh',
  })
  @IsOptional()
  @IsString({ message: 'slug phải là chuỗi' })
  @MaxLength(300, { message: 'slug tối đa 300 ký tự' })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Bài viết phân tích các biến động lớn trong chiến dịch.',
    description: 'Tóm tắt ngắn',
  })
  @IsOptional()
  @IsString({ message: 'summary phải là chuỗi' })
  @MaxLength(500, { message: 'summary tối đa 500 ký tự' })
  summary?: string;

  @ApiPropertyOptional({
    description: 'Nội dung dạng block JSON',
    example: [
      { type: 'paragraph', children: [{ text: 'Nội dung bài viết' }] },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'content phải là mảng JSON' })
  content?: any[];

  @ApiPropertyOptional({
    example: '<p>Nội dung HTML</p>',
    description: 'Nội dung rich text dạng text',
  })
  @IsOptional()
  @IsString({ message: 'contentRichText phải là chuỗi' })
  contentRichText?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/thumb.jpg',
    description: 'Ảnh thumbnail',
  })
  @IsOptional()
  @IsString({ message: 'thumbnailUrl phải là chuỗi' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/cover.jpg',
    description: 'Ảnh bìa',
  })
  @IsOptional()
  @IsString({ message: 'coverImageUrl phải là chuỗi' })
  coverImageUrl?: string;
}
