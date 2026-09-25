import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus, DifficultyLevel, MediaType } from '@prisma/client';

export class CreateLessonMediaDto {
  @ApiPropertyOptional({
    enum: MediaType,
    example: MediaType.IMAGE,
    description: 'Loại media (IMAGE, VIDEO, DOCUMENT)',
    default: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType = MediaType.IMAGE;

  @ApiProperty({
    example: 'https://example.com/images/bach-dang-coc-go.jpg',
    description: 'Đường dẫn URL của file ảnh/video/tài liệu',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'URL media không được để trống' })
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({
    example: 'Trận địa cọc gỗ trên sông Bạch Đằng năm 938',
    description: 'Chú thích hình ảnh/video',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  caption?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị media',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0;
}

export class CreateLessonDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của Chủ đề lịch sử (Topic) chứa bài học này (UUID)',
  })
  @IsUUID('4', { message: 'topicId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'topicId không được để trống' })
  topicId: string;

  @ApiProperty({
    example: 'Chiến thắng Bạch Đằng năm 938',
    description: 'Tiêu đề bài học lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài học không được để trống' })
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example:
      '<p>Năm 938, Ngô Quyền đã dùng trận địa cọc gỗ cắm trên sông Bạch Đằng...</p>',
    description: 'Nội dung bài học dạng Rich Text / HTML / Markdown',
  })
  @IsString()
  @IsOptional()
  contentRichText?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/bach-dang.jpg',
    description: 'URL ảnh xem trước / thumbnail bài học',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM,
    description: 'Độ khó bài học (EASY, MEDIUM, HARD)',
    default: DifficultyLevel.MEDIUM,
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel = DifficultyLevel.MEDIUM;

  @ApiPropertyOptional({
    example: 'Đại Việt Sử Ký Toàn Thư, Tập 1, NXB Khoa Học Xã Hội',
    description: 'Trích dẫn nguồn tư liệu lịch sử tham khảo',
  })
  @IsString()
  @IsOptional()
  sourceReferenceNote?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị bài học trong Topic',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
    description: 'Trạng thái phát hành (DRAFT, PENDING_REVIEW, PUBLISHED...)',
    default: ContentStatus.DRAFT,
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus = ContentStatus.DRAFT;

  @ApiPropertyOptional({
    type: [CreateLessonMediaDto],
    description: 'Danh sách các ảnh/video minh họa kèm theo bài học',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonMediaDto)
  media?: CreateLessonMediaDto[];
}
