import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EventCategory, FigureRole, TopicIcon } from '@prisma/client';
import { LandingSection } from '../public-content.constant';
import type { HeritageProfile } from '../mappers/heritage-profile.mapper';

export class PublicPeriodDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) parentId: string | null;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '(thế kỷ VII TCN - thế kỷ II TCN)' })
  timeLabel: string;
  @ApiPropertyOptional({ nullable: true }) startYear?: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear: number | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) coverImageUrl: string | null;
  @ApiPropertyOptional({ nullable: true, example: 'Việt Nam' }) region:
    string | null;
}

export class PublicTopicDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) eyebrow: string | null;
  @ApiPropertyOptional({ enum: TopicIcon, nullable: true })
  icon: TopicIcon | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) coverImageUrl: string | null;
}

export class PublicFigureDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) tagline: string | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl: string | null;
  @ApiPropertyOptional({ nullable: true }) birthYear: number | null;
  @ApiPropertyOptional({ nullable: true }) deathYear: number | null;
}

export class PublicFigureEventDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) slug: string | null;
  @ApiProperty() title: string;
  @ApiProperty() startYear: number;
  @ApiPropertyOptional({ nullable: true }) eventDateNote: string | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ enum: EventCategory }) category: EventCategory;
  @ApiPropertyOptional({ nullable: true }) periodSlug: string | null;
  @ApiProperty({ example: 'COMMANDER' }) role: string;
  @ApiPropertyOptional({ nullable: true }) roleLabel: string | null;
  @ApiProperty() isPrimary: boolean;
}

export class PublicFigureRelationDto {
  @ApiProperty() figureId: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: 'SUCCESSOR_TO' }) relationType: string;
  @ApiProperty({ enum: ['OUTGOING', 'INCOMING'] })
  direction: 'OUTGOING' | 'INCOMING';
  @ApiPropertyOptional({ nullable: true }) note: string | null;
  @ApiPropertyOptional({ nullable: true }) startYear: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear: number | null;
}

/** Nội dung "Tiểu sử & di sản", lưu trong HistoricalEntity.metadata.profile (JSONB). */
export class PublicFigureLegacyDto {
  @ApiPropertyOptional({ nullable: true }) hometown: string | null;
  @ApiPropertyOptional({ nullable: true }) backgroundAndYouth: string | null;
  @ApiProperty({ type: [String] }) notableWorks: string[];
  @ApiPropertyOptional({ nullable: true }) legacyAndHonors: string | null;
  @ApiProperty({ type: [String] }) anecdotes: string[];
  @ApiPropertyOptional({ nullable: true }) famousQuote: string | null;
}

export class PublicFigureProfileDto extends PublicFigureDto {
  @ApiProperty({ enum: FigureRole, isArray: true }) roles: FigureRole[];
  @ApiProperty({ type: PublicFigureLegacyDto }) legacy: PublicFigureLegacyDto;
  @ApiProperty({ type: [String] }) aliases: string[];
  @ApiPropertyOptional({ nullable: true }) birthDateLabel: string | null;
  @ApiPropertyOptional({ nullable: true }) deathDateLabel: string | null;
  @ApiPropertyOptional({ nullable: true }) biography: string | null;
  @ApiPropertyOptional({ nullable: true }) occupation: string | null;
  @ApiProperty({ type: [String] }) titles: string[];
  @ApiProperty({ type: [String] }) sources: string[];
  @ApiPropertyOptional({ nullable: true }) periodSlug: string | null;
  @ApiProperty({ type: [PublicFigureEventDto] }) events: PublicFigureEventDto[];
  @ApiProperty({ type: [PublicFigureRelationDto] })
  relationships: PublicFigureRelationDto[];
}

export class PublicLocationSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) address: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude: number | null;
  @ApiPropertyOptional({ nullable: true }) historicalSignificance:
    string | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl?: string | null;
  /** Mã loại di tích đã chuẩn hóa (xem site-type.constant). */
  @ApiPropertyOptional() siteType?: string;
  @ApiPropertyOptional() siteTypeLabel?: string;
  /** Mã cấp xếp hạng (danh mục HERITAGE_RANK); null = chưa xếp hạng. */
  @ApiPropertyOptional({ nullable: true }) rankCode?: string | null;
  @ApiPropertyOptional({ nullable: true }) rankLabel?: string | null;
  @ApiPropertyOptional({ nullable: true }) recognitionLevel?: string | null;
  @ApiPropertyOptional({ nullable: true }) constructionLabel?: string | null;
  @ApiPropertyOptional({ nullable: true }) periodSlug?: string | null;
  /** Các tên gọi trong lịch sử (HistoricalEntity.aliases). */
  @ApiPropertyOptional({ type: [String] }) ancientNames?: string[];
  /** Chữ gốc trong DB (tự do) — giao diện dùng preservationCategory + statusNote. */
  @ApiPropertyOptional({ nullable: true }) preservationStatus?: string | null;
  /** Hiện trạng chuẩn hóa (5 nhóm, xem preservation-status.constant). */
  @ApiPropertyOptional({ nullable: true }) preservationCategory?: string | null;
  @ApiPropertyOptional({ nullable: true }) preservationLabel?: string | null;
  /** Phần chữ còn lại sau khi chuẩn hóa — chỉ hiển thị, không lọc. */
  @ApiPropertyOptional({ nullable: true }) statusNote?: string | null;
  /** Đơn vị quản lý (bảo tàng, cơ quan...). */
  @ApiPropertyOptional({ nullable: true }) managingUnit?: string | null;
  /** Mức độ "trải nghiệm số" có sẵn — để lọc ngay ở danh sách. */
  @ApiPropertyOptional() digital?: {
    hasImage: boolean;
    galleryCount: number;
    hasThenAndNow: boolean;
    hasChronicle: boolean;
    hasStructures: boolean;
  };
}

export class PublicEventSummaryDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true }) slug: string | null;
  @ApiProperty() title: string;
  @ApiProperty() startYear: number;
  @ApiPropertyOptional({ nullable: true }) eventDateNote: string | null;
  @ApiPropertyOptional({ nullable: true }) location: string | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl: string | null;
  @ApiProperty({ enum: EventCategory }) category: EventCategory;
  @ApiPropertyOptional({ nullable: true }) periodSlug: string | null;
  @ApiProperty({ type: [PublicFigureDto] }) figures: PublicFigureDto[];
  @ApiProperty({ type: [PublicLocationSummaryDto] })
  locations: PublicLocationSummaryDto[];
}

export class PublicLessonSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional({ nullable: true }) contentRichText: string | null;
  @ApiPropertyOptional({ nullable: true }) sourceReferenceNote: string | null;
  @ApiProperty() estimatedReadMinutes: number;
  @ApiProperty({ type: [PublicEventSummaryDto] })
  events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicFigureDto] }) entities: PublicFigureDto[];
  @ApiProperty({ type: [PublicLocationSummaryDto] })
  locations: PublicLocationSummaryDto[];
}

export class PublicEventRelationDto {
  @ApiProperty() relationType: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ type: () => PublicEventSummaryDto })
  event: PublicEventSummaryDto;
}

export class PublicLessonTagDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) colorHex: string | null;
}

/** Bài học trong thư viện công khai — chỉ thông tin giới thiệu, không có nội dung bài. */
export class PublicLibraryLessonDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) thumbnailUrl: string | null;
  @ApiProperty() difficulty: string;
  @ApiProperty() estimatedReadMinutes: number;
  @ApiProperty({ type: [PublicLessonTagDto] }) tags: PublicLessonTagDto[];
}

export class PublicEventParticipantDto {
  @ApiProperty() entityId: string;
  @ApiProperty() role: string;
  @ApiPropertyOptional({ nullable: true }) roleLabel: string | null;
  @ApiProperty() isPrimary: boolean;
}

export class PublicEventDetailDto extends PublicEventSummaryDto {
  @ApiPropertyOptional({ nullable: true }) summary: string | null;
  @ApiPropertyOptional({ nullable: true }) startMonth: number | null;
  @ApiPropertyOptional({ nullable: true }) startDay: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear: number | null;
  @ApiPropertyOptional({ nullable: true }) endMonth: number | null;
  @ApiPropertyOptional({ nullable: true }) endDay: number | null;
  @ApiPropertyOptional({ nullable: true }) cause: string | null;
  @ApiPropertyOptional({ nullable: true }) outcome: string | null;
  @ApiProperty({ type: [String] }) sources: string[];
  @ApiProperty({ type: [PublicEventParticipantDto] })
  participants: PublicEventParticipantDto[];
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  period: PublicPeriodDto | null;
  @ApiPropertyOptional({ type: () => PublicEventSummaryDto, nullable: true })
  parent: PublicEventSummaryDto | null;
  @ApiProperty({ type: [PublicEventSummaryDto] })
  children: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicEventRelationDto] })
  outgoingRelations: PublicEventRelationDto[];
  @ApiProperty({ type: [PublicEventRelationDto] })
  incomingRelations: PublicEventRelationDto[];
}

export class PublicChildTopicDto extends PublicTopicDto {
  @ApiProperty({ type: [PublicEventSummaryDto] })
  events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicLessonSummaryDto] })
  lessons: PublicLessonSummaryDto[];
}

export class PublicLocationMediaDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'IMAGE' }) type: string;
  @ApiProperty() url: string;
  @ApiPropertyOptional({ nullable: true }) caption: string | null;
}

export class PublicNearbyLocationDto extends PublicLocationSummaryDto {
  @ApiProperty() distanceKm: number;
}

export class PublicLocationDetailDto extends PublicLocationSummaryDto {
  @ApiPropertyOptional({ nullable: true }) tagline: string | null;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) imageCaption: string | null;
  @ApiPropertyOptional({ nullable: true }) constructionYear: number | null;
  @ApiPropertyOptional({ nullable: true }) managingAgency: string | null;
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  period: PublicPeriodDto | null;
  @ApiProperty({ type: [PublicLocationMediaDto] })
  media: PublicLocationMediaDto[];
  /** Sự kiện diễn ra tại di tích (địa điểm chính hoặc có gắn di tích này). */
  @ApiProperty({ type: [PublicEventSummaryDto] })
  events: PublicEventSummaryDto[];
  /** Nhân vật tham gia các sự kiện tại đây. */
  @ApiProperty({ type: [PublicFigureDto] }) figures: PublicFigureDto[];
  @ApiProperty({ type: [PublicNearbyLocationDto] })
  nearby: PublicNearbyLocationDto[];
  /** Hồ sơ di sản mở rộng (metadata.heritage) — xem heritage-profile.mapper. */
  @ApiProperty() heritage: HeritageProfile;
}

export class PublicSubPeriodDto extends PublicPeriodDto {
  @ApiProperty() eventCount: number;
  @ApiProperty() figureCount: number;
}

export class PublicPeriodDetailDto extends PublicPeriodDto {
  @ApiProperty({ type: [PublicTopicDto] }) topics: PublicTopicDto[];
  /** Nhân vật của thời kỳ và các giai đoạn con, cộng nhân vật tham gia sự kiện trong thời kỳ. */
  @ApiProperty({ type: [PublicFigureDto] }) figures: PublicFigureDto[];
  /** Sự kiện của thời kỳ và mọi giai đoạn con. */
  @ApiProperty({ type: [PublicEventSummaryDto] })
  events: PublicEventSummaryDto[];
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  parent: PublicPeriodDto | null;
  @ApiProperty({ type: [PublicSubPeriodDto] }) children: PublicSubPeriodDto[];
  @ApiProperty({ type: [PublicLocationSummaryDto] })
  locations: PublicLocationSummaryDto[];
  /** Thời kỳ ở khu vực khác diễn ra cùng lúc (giao nhau về năm). */
  @ApiProperty({ type: [PublicPeriodDto] })
  concurrentPeriods: PublicPeriodDto[];
  /** Sự kiện ở khu vực khác trong cùng khoảng năm. */
  @ApiProperty({ type: [PublicEventSummaryDto] })
  concurrentEvents: PublicEventSummaryDto[];
}

export class PublicTopicDetailDto extends PublicTopicDto {
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  period: PublicPeriodDto | null;
  @ApiProperty({ type: [PublicChildTopicDto] }) children: PublicChildTopicDto[];
  @ApiProperty({ type: [PublicEventSummaryDto] })
  events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicLessonSummaryDto] })
  lessons: PublicLessonSummaryDto[];
}

export class PublicFigureDetailDto extends PublicFigureDto {
  @ApiPropertyOptional({ type: () => PublicPeriodDto, nullable: true })
  period: PublicPeriodDto | null;
  @ApiProperty({ type: [PublicEventSummaryDto] })
  events: PublicEventSummaryDto[];
  @ApiProperty({ type: [PublicLessonSummaryDto] })
  lessons: PublicLessonSummaryDto[];
}

export class LandingResponseDto {
  @ApiProperty({ type: [PublicPeriodDto] }) periods: PublicPeriodDto[];
  @ApiProperty({ type: [PublicTopicDto] }) chapters: PublicTopicDto[];
  @ApiProperty({ type: [PublicTopicDto] }) knowledge: PublicTopicDto[];
  @ApiProperty({ type: [PublicFigureDto] }) figures: PublicFigureDto[];
}

export class QueryPublicTopicsDto {
  @ApiProperty({ enum: LandingSection })
  @IsEnum(LandingSection)
  section: LandingSection;
}
