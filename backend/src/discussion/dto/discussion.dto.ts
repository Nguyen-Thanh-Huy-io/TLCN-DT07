import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscussionTargetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDiscussionThreadDto {
  @ApiProperty({
    enum: DiscussionTargetType,
    example: DiscussionTargetType.LESSON,
  })
  @IsEnum(DiscussionTargetType)
  targetType: DiscussionTargetType;

  @ApiProperty({ description: 'ID của Bài học hoặc Bài viết' })
  @IsUUID('4')
  targetId: string;

  @ApiPropertyOptional({ description: 'ID Khóa học chứa bài học (nếu có)' })
  @IsOptional()
  @IsUUID('4')
  learningPathId?: string;

  @ApiProperty({ example: 'Tại sao lại chọn sông Bạch Đằng để đóng cọc gỗ?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Em muốn hỏi về quy luật thuỷ triều thời điểm đó...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateDiscussionReplyDto {
  @ApiProperty({
    example: 'Sông Bạch Đằng có biên độ triều lớn, địa hình hiểm trở...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class QueryDiscussionDto {
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

  @ApiPropertyOptional({ enum: DiscussionTargetType })
  @IsOptional()
  @IsEnum(DiscussionTargetType)
  targetType?: DiscussionTargetType;

  @ApiPropertyOptional({ description: 'Lọc theo ID bài học hoặc bài viết' })
  @IsOptional()
  @IsUUID('4')
  targetId?: string;

  @ApiPropertyOptional({
    description: 'Gom nhóm toàn bộ thảo luận của Khóa học',
  })
  @IsOptional()
  @IsUUID('4')
  learningPathId?: string;

  @ApiPropertyOptional({
    description: 'Chỉ lấy các câu đã hoặc chưa được BTV giải đáp',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAnswered?: boolean;

  @ApiPropertyOptional({
    description: 'Tìm theo tiêu đề hoặc nội dung thắc mắc',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
