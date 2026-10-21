import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus, HistoricalEntityType, MediaType } from '@prisma/client';
import { EntityRelationType } from '../historical-entity.constant';

export class CreateHistoricalEntityDto {
  @ApiPropertyOptional({
    example: 'a0000000-0000-4000-8000-000000000001',
    description: 'ID giai đoạn lịch sử chính/tiêu biểu (nếu có)',
  })
  @IsUUID('4')
  @IsOptional()
  periodId?: string;

  @ApiPropertyOptional({
    example: [
      'a0000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002',
    ],
    description: 'Danh sách các thời kỳ / giai đoạn lịch sử mà thực thể thuộc về hoặc trải qua',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  periodIds?: string[];


  @ApiProperty({
    example: 'Trần Hưng Đạo',
    description: 'Tên nhân vật, tổ chức, triều đại hoặc hiện vật',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    enum: HistoricalEntityType,
    default: HistoricalEntityType.PERSON,
    description: 'Phân loại thực thể lịch sử',
  })
  @IsEnum(HistoricalEntityType)
  @IsOptional()
  type?: HistoricalEntityType = HistoricalEntityType.PERSON;

  @ApiPropertyOptional({
    example: 'Quốc công Tiết chế thống lĩnh chư quân thời Trần',
    description: 'Chức danh / mô tả ngắn hiển thị trên thẻ',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  tagline?: string;

  @ApiPropertyOptional({
    example:
      'Trần Hưng Đạo tên thật là Trần Quốc Tuấn, là anh hùng dân tộc vĩ đại ba lần lãnh đạo quân dân Đại Việt đánh tan quân Nguyên Mông.',
    description: 'Mô tả / hồ sơ chi tiết của thực thể',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: ['Trần Quốc Tuấn', 'Hưng Đạo Đại Vương', 'Đức Thánh Trần'],
    description: 'Danh sách bí danh, tên húy, chữ Hán hoặc tước hiệu',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  aliases?: string[];

  @ApiPropertyOptional({
    example: '/assets/figures/tran-hung-dao.jpg',
    description: 'Đường dẫn ảnh đại diện',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'Tượng đồng Hưng Đạo Đại Vương tại đền Kiếp Bạc',
    description: 'Chú thích ảnh tư liệu',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  imageCaption?: string;

  @ApiPropertyOptional({
    example: 1228,
    description: 'Năm sinh hoặc năm thành lập (hỗ trợ số âm cho TCN) - Tương thích ngược',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  birthYear?: number;

  @ApiPropertyOptional({
    example: 1300,
    description: 'Năm mất hoặc năm kết thúc hoạt động - Tương thích ngược',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  deathYear?: number;

  @ApiPropertyOptional({
    example: 'Khoảng năm 1228',
    description: 'Nhãn hiển thị ngày sinh/thành lập dạng chữ - Tương thích ngược',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  birthDateLabel?: string;

  @ApiPropertyOptional({
    example: 'Mùa thu năm Canh Tý (1300)',
    description: 'Nhãn hiển thị ngày mất/kết thúc dạng chữ - Tương thích ngược',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  deathDateLabel?: string;

  @ApiPropertyOptional({
    example: 'Tướng lĩnh / Nhà quân sự Đại Việt',
    description: 'Nghề nghiệp / Lĩnh vực hoạt động (Dành cho Person)',
  })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiPropertyOptional({
    example: ['Tiết chế', 'Hưng Đạo Đại Vương'],
    description: 'Tước hiệu, chức vị (Dành cho Person)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  titles?: string[];

  @ApiPropertyOptional({
    example: 'Di tích quốc gia đặc biệt',
    description: 'Loại hình di tích (Dành cho HistoricalSite: Đền thờ, Lăng mộ, Chiến trường...)',
  })
  @IsString()
  @IsOptional()
  siteType?: string;

  @ApiPropertyOptional({
    example: 'Xã Hưng Đạo, thành phố Chí Linh, tỉnh Hải Dương',
    description: 'Địa chỉ cụ thể của di tích (Dành cho HistoricalSite)',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 21.0347,
    description: 'Vĩ độ tọa độ địa lý (Dành cho HistoricalSite)',
  })
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: 105.8407,
    description: 'Kinh độ tọa độ địa lý (Dành cho HistoricalSite)',
  })
  @Type(() => Number)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: 1300,
    description: 'Năm xây dựng hoặc khởi dựng di tích (Dành cho HistoricalSite)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  constructionYear?: number;

  @ApiPropertyOptional({
    example: 'Thế kỷ XIV',
    description: 'Nhãn thời gian xây dựng (Dành cho HistoricalSite)',
  })
  @IsString()
  @IsOptional()
  constructionLabel?: string;

  @ApiPropertyOptional({
    example: 'Tốt',
    description: 'Tình trạng bảo tồn (Dành cho HistoricalSite)',
  })
  @IsString()
  @IsOptional()
  preservationStatus?: string;

  @ApiPropertyOptional({
    example: 'Đặc biệt cấp quốc gia',
    description: 'Cấp xếp hạng di tích (Dành cho HistoricalSite)',
  })
  @IsString()
  @IsOptional()
  recognitionLevel?: string;

  @ApiPropertyOptional({
    example: 'Ban Quản lý Di tích Côn Sơn - Kiếp Bạc',
    description: 'Cơ quan / Đơn vị quản lý di tích (Dành cho HistoricalSite)',
  })
  @IsString()
  @IsOptional()
  managingAgency?: string;

  @ApiPropertyOptional({
    example: {
      dynasty: 'Nhà Trần',
      hometown: 'Nam Định',
      office: 'Quốc công Tiết chế',
    },
    description: 'Dữ liệu mở rộng linh hoạt theo từng chủng loại (JSONB)',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: true,
    description: 'Hiển thị ở section tiêu biểu',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  @ApiPropertyOptional({
    example: 1,
    description: 'Thứ tự hiển thị',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0;

  @ApiPropertyOptional({
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
    description: 'Trạng thái xuất bản',
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus = ContentStatus.DRAFT;
}

export class UpdateHistoricalEntityDto extends PartialType(
  CreateHistoricalEntityDto,
) {}

export class QueryHistoricalEntityDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: HistoricalEntityType })
  @IsEnum(HistoricalEntityType)
  @IsOptional()
  type?: HistoricalEntityType;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsUUID('4')
  @IsOptional()
  periodId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

// ==========================================
// DTOs cho Quan Hệ Hồi Quy N-N (Knowledge Graph Edge)
// ==========================================
export class CreateEntityRelationDto {
  @ApiProperty({
    example: 'b0000000-0000-4000-8000-000000000002',
    description: 'ID của thực thể đích (nơi mũi tên quan hệ trỏ tới)',
  })
  @IsUUID('4')
  @IsNotEmpty()
  targetEntityId: string;

  @ApiProperty({
    enum: EntityRelationType,
    example: EntityRelationType.LEADER_OF,
    description: 'Loại quan hệ ngữ nghĩa giữa 2 thực thể',
  })
  @IsEnum(EntityRelationType)
  @IsNotEmpty()
  relationType: EntityRelationType;

  @ApiPropertyOptional({
    example: 1285,
    description: 'Năm bắt đầu quan hệ (VD: năm bắt đầu chỉ huy/trị vì)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  startYear?: number;

  @ApiPropertyOptional({
    example: 1300,
    description: 'Năm kết thúc quan hệ',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  endYear?: number;

  @ApiPropertyOptional({
    example: 'Tổng chỉ huy trong cuộc kháng chiến chống quân Nguyên Mông lần 2 và 3',
    description: 'Ghi chú bổ sung ngữ cảnh cho mối quan hệ',
  })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateEntityRelationDto extends PartialType(
  CreateEntityRelationDto,
) {}

// ==========================================
// DTOs cho Tài Liệu Đa Phương Tiện (Media)
// ==========================================
export class CreateEntityMediaDto {
  @ApiProperty({
    enum: MediaType,
    default: MediaType.IMAGE,
    description: 'Loại media: IMAGE, VIDEO hoặc DOCUMENT',
  })
  @IsEnum(MediaType)
  @IsNotEmpty()
  type: MediaType;

  @ApiProperty({
    example: 'https://example.com/assets/tran-hung-dao-hich-tuong-si.pdf',
    description: 'Đường dẫn URL của file tài liệu / ảnh / video',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({
    example: 'Bản dịch toàn văn Hịch tướng sĩ lưu trữ tại Viện Sử học',
    description: 'Chú thích cho tài liệu / media',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  caption?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Thứ tự hiển thị',
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number = 0;
}

// ==========================================
// Response DTOs
// ==========================================
export class EntityMediaResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() entityId: string;
  @ApiProperty({ enum: MediaType }) type: MediaType;
  @ApiProperty() url: string;
  @ApiPropertyOptional({ nullable: true }) caption?: string | null;
  @ApiProperty() displayOrder: number;
  @ApiProperty() createdAt: Date;
}

export class PersonResponseDto {
  @ApiProperty() entityId: string;
  @ApiPropertyOptional({ nullable: true }) birthYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) deathYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) birthDateLabel?: string | null;
  @ApiPropertyOptional({ nullable: true }) deathDateLabel?: string | null;
  @ApiPropertyOptional({ nullable: true }) biography?: string | null;
  @ApiPropertyOptional({ nullable: true }) occupation?: string | null;
  @ApiProperty({ type: [String] }) titles: string[];
}

export class HistoricalSiteResponseDto {
  @ApiProperty() entityId: string;
  @ApiProperty() siteType: string;
  @ApiPropertyOptional({ nullable: true }) address?: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude?: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude?: number | null;
  @ApiPropertyOptional({ nullable: true }) constructionYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) constructionLabel?: string | null;
  @ApiPropertyOptional({ nullable: true }) preservationStatus?: string | null;
  @ApiPropertyOptional({ nullable: true }) recognitionLevel?: string | null;
  @ApiPropertyOptional({ nullable: true }) managingAgency?: string | null;
}

export class HistoricalEntityResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) periodId?: string | null;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty({ enum: HistoricalEntityType }) type: HistoricalEntityType;
  @ApiPropertyOptional({ nullable: true }) tagline?: string | null;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty({ type: [String] }) aliases: string[];
  @ApiPropertyOptional({ nullable: true }) imageUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) imageCaption?: string | null;
  @ApiPropertyOptional({ nullable: true }) birthYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) deathYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) birthDateLabel?: string | null;
  @ApiPropertyOptional({ nullable: true }) deathDateLabel?: string | null;
  @ApiPropertyOptional({ nullable: true }) metadata?: Record<string, any> | null;
  @ApiProperty() isFeatured: boolean;
  @ApiProperty() displayOrder: number;
  @ApiProperty({ enum: ContentStatus }) status: ContentStatus;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional({ type: () => PersonResponseDto, nullable: true })
  person?: PersonResponseDto | null;
  @ApiPropertyOptional({ type: () => HistoricalSiteResponseDto, nullable: true })
  historicalSite?: HistoricalSiteResponseDto | null;
  @ApiPropertyOptional({ type: () => [EntityRelationResponseDto] })
  outgoingRelations?: EntityRelationResponseDto[];
  @ApiPropertyOptional({ type: () => [EntityRelationResponseDto] })
  incomingRelations?: EntityRelationResponseDto[];
  @ApiPropertyOptional({ type: () => [EntityMediaResponseDto] })
  media?: EntityMediaResponseDto[];
}

export class EntityRelationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sourceEntityId: string;
  @ApiProperty() targetEntityId: string;
  @ApiProperty({ enum: EntityRelationType }) relationType: EntityRelationType;
  @ApiPropertyOptional({ nullable: true }) startYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) note?: string | null;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional({ type: () => HistoricalEntityResponseDto })
  targetEntity?: HistoricalEntityResponseDto;
  @ApiPropertyOptional({ type: () => HistoricalEntityResponseDto })
  sourceEntity?: HistoricalEntityResponseDto;
}

