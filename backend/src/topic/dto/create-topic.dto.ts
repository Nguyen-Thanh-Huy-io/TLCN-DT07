import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus, TopicScope } from '@prisma/client';

export class CreateTopicDto {
  @ApiProperty({
    enum: TopicScope,
    example: TopicScope.CHRONOLOGICAL,
    description: 'Phạm vi / cách tiếp cận của chủ đề: CHRONOLOGICAL (tiến trình lịch sử) hoặc THEMATIC (chuyên đề liên đại)',
    default: TopicScope.CHRONOLOGICAL,
  })
  @IsEnum(TopicScope, { message: 'scope phải là CHRONOLOGICAL hoặc THEMATIC' })
  @IsNotEmpty({ message: 'scope không được để trống' })
  scope: TopicScope = TopicScope.CHRONOLOGICAL;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của Giai đoạn lịch sử chứa chủ đề này (bắt buộc khi scope = CHRONOLOGICAL)',
  })
  @ValidateIf((o) => o.scope === TopicScope.CHRONOLOGICAL || o.periodId)
  @IsUUID('4', { message: 'periodId phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'periodId không được để trống khi scope là CHRONOLOGICAL' })
  periodId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của Địa điểm lịch sử liên kết chủ đề (cho lịch sử địa phương/khu vực)',
  })
  @IsUUID('4', { message: 'locationId phải là UUID hợp lệ' })
  @IsOptional()
  locationId?: string;

  @ApiProperty({
    example: 'Khởi nghĩa Hai Bà Trưng',
    description: 'Tên chủ đề lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tên chủ đề không được để trống' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Cuộc khởi nghĩa chống lại ách đô hộ của nhà Hán...',
    description: 'Mô tả chi tiết chủ đề',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/hai-ba-trung.jpg',
    description: 'URL ảnh đại diện chủ đề',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Bài học trong chủ đề có yêu cầu học theo thứ tự hay không',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSequential?: boolean = false;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    enum: ContentStatus,
    example: ContentStatus.DRAFT,
    description: 'Trạng thái phát hành của chủ đề',
    default: ContentStatus.DRAFT,
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus = ContentStatus.DRAFT;
}
