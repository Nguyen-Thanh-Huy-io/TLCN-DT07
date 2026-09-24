import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus, DifficultyLevel } from '@prisma/client';

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
    example: '<p>Năm 938, Ngô Quyền đã dùng trận địa cọc gỗ cắm trên sông Bạch Đằng...</p>',
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
    example: 10,
    description: 'Số điểm XP thưởng khi đọc/hoàn thành bài học',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  xpReward?: number = 10;

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
}
