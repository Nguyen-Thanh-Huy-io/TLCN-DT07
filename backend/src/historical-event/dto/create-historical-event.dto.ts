import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus, EventCategory, MediaType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
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

export class CreateHistoricalEventDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'ID của Chủ đề lịch sử (Topic) chứa sự kiện này (tùy chọn)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'topicId phải là UUID hợp lệ' })
  topicId?: string;

  @ApiPropertyOptional({
    description: 'ID của Thời kỳ lịch sử (Period) (tùy chọn)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'periodId phải là UUID hợp lệ' })
  periodId?: string;

  @ApiPropertyOptional({
    description: 'ID của Di tích / Địa danh lịch sử chính (HistoricalSite entityId) (tùy chọn)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'siteId phải là UUID hợp lệ' })
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Alias backward-compatible cho siteId',
  })
  @IsOptional()
  @IsUUID('4', { message: 'locationId phải là UUID hợp lệ' })
  locationId?: string;

  @ApiPropertyOptional({
    description: 'ID của Sự kiện cha (HistoricalEvent parentId) cho cấu trúc phân cấp (tùy chọn)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'parentId phải là UUID hợp lệ' })
  parentId?: string;

  @ApiProperty({
    example: 'Trận Bạch Đằng năm 938',
    description: 'Tên sự kiện lịch sử',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tên sự kiện không được để trống' })
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'tran-bach-dang-nam-938',
    description: 'Đường dẫn tĩnh (slug) tùy chỉnh của sự kiện (tùy chọn)',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({
    example: 1959,
    description: 'Năm bắt đầu diễn ra sự kiện (Số nguyên, có thể âm với TCN)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Năm diễn ra sự kiện phải là số nguyên' })
  @IsNotEmpty({ message: 'Năm diễn ra sự kiện không được để trống' })
  startYear: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Tháng bắt đầu (1..12, tùy chọn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({
    example: 19,
    description: 'Ngày bắt đầu (1..31, tùy chọn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  startDay?: number;

  @ApiPropertyOptional({
    example: 1975,
    description: 'Năm kết thúc sự kiện (tùy chọn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endYear?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Tháng kết thúc (1..12, tùy chọn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Ngày kết thúc (1..31, tùy chọn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  endDay?: number;

  @ApiPropertyOptional({
    example: '19/05/1959 – 30/04/1975',
    description: 'Chuỗi thời gian hiển thị trên giao diện bài viết',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  eventDateNote?: string;

  @ApiPropertyOptional({
    example:
      'Tuyến giao thông quân sự chiến lược chi viện sức người, sức của từ hậu phương miền Bắc cho tiền tuyến miền Nam.',
    description: 'Tóm tắt ngắn (2-3 dòng làm card/preview)',
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({
    example:
      'Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng, chấm dứt 1000 năm Bắc thuộc...',
    description: 'Diễn biến chi tiết sự kiện (Rich Text)',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482',
    description: 'URL ảnh minh họa / tư liệu đại diện của sự kiện',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  thumbnailUrl?: string;

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
    default: ContentStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    enum: EventCategory,
    default: EventCategory.OTHER,
    description: 'Phân loại sự kiện (BATTLE, WAR, TREATY, REVOLUTION, POLITICAL_EVENT, SUMMIT_CONFERENCE, CULTURE_SCIENCE, NATURAL_DISASTER, OTHER)',
  })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Id các loại sự kiện trong danh mục dùng chung (nhóm EVENT_CATEGORY); phần tử đầu là loại chính. Có giá trị thì ưu tiên hơn category.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description:
      'Thông tin riêng theo loại sự kiện — trường khai báo trong meta.fields của danh mục loại sự kiện (kế thừa theo cây); khóa khác giữ nguyên',
    example: {
      belligerents: ['Đại Cồ Việt', 'Nhà Tống'],
      commanders: ['Lê Hoàn', 'Hầu Nhân Bảo'],
      casualties: 'Hầu Nhân Bảo tử trận',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Danh sách ID các Thực thể lịch sử (Nhân vật, Lực lượng, Hiện vật) tham gia sự kiện',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  entityIds?: string[];

  @ApiPropertyOptional({
    description:
      'Danh sách thực thể kèm vai trò / loại quan hệ trong sự kiện (VD: Lãnh đạo, Chỉ đạo, Tham gia, Hậu cần...)',
  })
  @IsOptional()
  @IsArray()
  entityRelations?: Array<{
    entityId: string;
    role?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Danh sách tư liệu, hình ảnh, tài liệu và video đính kèm sự kiện',
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  media?: Array<{
    type?: MediaType;
    url: string;
    caption?: string;
    displayOrder?: number;
  }>;
}

