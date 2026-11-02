import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { DatePrecision, HistoricalEntityType } from '@prisma/client';
import {
  TIMELINE_SORT_ORDER,
  TimelineDirection,
  TimelineItemType,
  TimelineSortOrder,
} from './timeline.constant';

export class QueryPersonTimelineDto {
  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp niên đại (tăng dần hoặc giảm dần)',
    enum: TIMELINE_SORT_ORDER,
    default: TIMELINE_SORT_ORDER.ASC,
  })
  @IsOptional()
  @IsEnum(TIMELINE_SORT_ORDER)
  order?: TimelineSortOrder = TIMELINE_SORT_ORDER.ASC;

  @ApiPropertyOptional({
    description:
      'Có bao gồm các quan hệ phát biểu không phải sự kiện (ví dụ: quan hệ nhân vật - nhân vật) hay không',
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeStatements?: boolean = true;
}

export class TimelinePredicateDto {
  @ApiProperty({ description: 'ID của loại vị ngữ quan hệ' })
  id: string;

  @ApiProperty({ description: 'Mã vị ngữ (ví dụ: PARTICIPATED_IN, CONTEMPORARY_OF)' })
  code: string;

  @ApiProperty({ description: 'Nhãn hiển thị chiều xuôi' })
  label: string;

  @ApiPropertyOptional({ description: 'Nhãn hiển thị chiều ngược' })
  inverseLabel?: string | null;
}

export class TimelineEventSummaryDto {
  @ApiProperty({ description: 'ID của sự kiện' })
  id: string;

  @ApiProperty({ description: 'Tiêu đề sự kiện lịch sử' })
  title: string;

  @ApiProperty({ description: 'Slug định danh sự kiện' })
  slug: string;

  @ApiProperty({ description: 'Phân loại sự kiện' })
  category: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện sự kiện' })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ description: 'Chuỗi văn bản ngày tháng của sự kiện' })
  dateText?: string | null;
}

export class TimelineReferenceSummaryDto {
  @ApiProperty({ description: 'ID nguồn tài liệu' })
  id: string;

  @ApiProperty({ description: 'Tên tài liệu / thư tịch cổ' })
  title: string;

  @ApiPropertyOptional({ description: 'Tác giả' })
  author?: string | null;

  @ApiPropertyOptional({ description: 'Trang sách' })
  pageNumber?: string | null;

  @ApiPropertyOptional({ description: 'Đoạn trích' })
  quote?: string | null;
}

export class PersonTimelineItemDto {
  @ApiProperty({ description: 'ID định danh duy nhất của mốc thời gian' })
  id: string;

  @ApiProperty({
    description: 'Loại mốc thời gian',
    enum: TimelineItemType,
  })
  type: TimelineItemType;

  @ApiProperty({ description: 'Tiêu đề mốc thời gian' })
  title: string;

  @ApiPropertyOptional({ description: 'Năm diễn ra (có dấu, âm cho TCN)' })
  year: number | null;

  @ApiPropertyOptional({ description: 'Tháng' })
  month?: number | null;

  @ApiPropertyOptional({ description: 'Ngày' })
  day?: number | null;

  @ApiPropertyOptional({ description: 'Chuỗi niên đại định dạng hiển thị' })
  dateText?: string | null;

  @ApiPropertyOptional({ description: 'Độ chính xác niên đại', enum: DatePrecision })
  datePrecision?: DatePrecision | null;

  @ApiPropertyOptional({ description: 'Mã vai trò (từ qualifiers)' })
  role?: string | null;

  @ApiPropertyOptional({ description: 'Nhãn vai trò tiếng Việt (từ qualifiers)' })
  roleLabel?: string | null;

  @ApiPropertyOptional({ description: 'Mô tả tóm tắt hoặc ghi chú' })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Chiều quan hệ so với thực thể gốc',
    enum: TimelineDirection,
  })
  direction?: TimelineDirection;

  @ApiPropertyOptional({ description: 'Thông tin vị ngữ quan hệ' })
  predicate?: TimelinePredicateDto | null;

  @ApiPropertyOptional({ description: 'Thông tin sự kiện liên kết (nếu có)' })
  event?: TimelineEventSummaryDto | null;

  @ApiPropertyOptional({ description: 'Danh sách nguồn chứng minh' })
  references?: TimelineReferenceSummaryDto[];

  @ApiProperty({ description: 'Đánh dấu là mốc quan trọng tiêu biểu' })
  isPrimary: boolean;
}

export class PersonTimelineResponseDto {
  @ApiProperty({ description: 'ID thực thể' })
  entityId: string;

  @ApiProperty({ description: 'Tên thực thể / nhân vật' })
  entityName: string;

  @ApiProperty({ description: 'Phân loại thực thể', enum: HistoricalEntityType })
  entityType: HistoricalEntityType;

  @ApiProperty({ description: 'Slug định danh' })
  slug: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện' })
  imageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Năm sinh (hoặc năm bắt đầu)' })
  birthYear?: number | null;

  @ApiPropertyOptional({ description: 'Năm mất (hoặc năm kết thúc)' })
  deathYear?: number | null;

  @ApiProperty({ description: 'Tổng số mốc thời gian trong timeline' })
  totalMilestones: number;

  @ApiProperty({
    description: 'Danh sách các mốc thời gian đã sắp xếp theo thứ tự',
    type: [PersonTimelineItemDto],
  })
  items: PersonTimelineItemDto[];
}
