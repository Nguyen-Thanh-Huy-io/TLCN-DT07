
export interface PublicPeriodDto {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  timeLabel: string;
  startYear: number;
  endYear: number | null;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PublicTopicDto {
  id: string;
  slug: string;
  name: string;
  eyebrow: string | null;
  icon: string | null;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PublicFigureDto {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  birthYear: number | null;
  deathYear: number | null;
}

export interface PublicLocationSummaryDto {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  historicalSignificance: string | null;
  imageUrl?: string | null;
  /** Mã loại di tích chuẩn hóa (LocationType). */
  siteType?: string;
  siteTypeLabel?: string;
  constructionLabel?: string | null;
  periodSlug?: string | null;
  /** Các tên gọi trong lịch sử. */
  ancientNames?: string[];
  preservationStatus?: string | null;
  /** Hiện trạng chuẩn hóa: INTACT | MUSEUM_MEMORIAL | ARCHAEOLOGICAL_RUIN | RESTORED | ACTIVE_SITE. */
  preservationCategory?: string | null;
  preservationLabel?: string | null;
  /** Ghi chú còn lại sau khi chuẩn hóa hiện trạng — chỉ hiển thị. */
  statusNote?: string | null;
  managingUnit?: string | null;
  /** Mức độ "trải nghiệm số" có sẵn của di tích. */
  digital?: {
    hasImage: boolean;
    galleryCount: number;
    hasThenAndNow: boolean;
    hasChronicle: boolean;
    hasStructures: boolean;
  };
}

/** Hồ sơ di sản mở rộng (metadata.heritage ở backend). */
export interface PublicHeritageProfileDto {
  recognizedYear: string | null;
  architecturalStyle: string | null;
  openingHours: string | null;
  constructionTimeline: Array<{
    id: string;
    dateLabel: string;
    dynasty: string;
    actionType: 'FOUNDED' | 'EXPANDED' | 'DAMAGED' | 'RESTORED';
    description: string;
  }>;
  subStructures: Array<{
    id: string;
    name: string;
    type: 'ARCHITECTURE' | 'NATIONAL_TREASURE';
    periodBuilt: string;
    description: string;
    imageUrl: string | null;
  }>;
  thenAndNow: { ancientImageUrl: string; ancientLabel: string; modernImageUrl: string; modernLabel: string } | null;
}

export interface PublicLocationDetailDto extends PublicLocationSummaryDto {
  tagline: string | null;
  description: string | null;
  imageCaption: string | null;
  constructionYear: number | null;
  preservationStatus: string | null;
  managingAgency: string | null;
  period: PublicPeriodDto | null;
  media: Array<{ id: string; type: string; url: string; caption: string | null }>;
  events: PublicEventSummaryDto[];
  figures: PublicFigureDto[];
  nearby: Array<PublicLocationSummaryDto & { distanceKm: number }>;
  heritage: PublicHeritageProfileDto;
  /** Nội dung tường thuật dạng Block Builder (giống Lesson.content); null = chưa có. */
  contentBlocks?: unknown;
}

export interface PublicEventSummaryDto {
  id: string;
  slug: string | null;
  title: string;
  startYear: number;
  eventDateNote: string | null;
  location: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string;
  /** Id loại trong danh mục EVENT_CATEGORY (phần tử đầu là loại chính). */
  categoryIds?: string[];
  /** Năm kết thúc (null = trong một năm / chưa rõ). */
  endYear?: number | null;
  parentId?: string | null;
  /** Quan hệ với sự kiện khác (đồ thị tri thức). */
  relations?: PublicEventLinkDto[];
  /** Chủ thể không phải nhân vật / địa danh: triều đại / quốc gia, tổ chức, lực lượng, hiện vật. */
  actors?: PublicEventActorDto[];
  periodSlug: string | null;
  figures: PublicFigureDto[];
  locations: PublicLocationSummaryDto[];
}

export interface PublicEventRelationDto {
  relationType: string;
  description: string | null;
  event: PublicEventSummaryDto;
}

export interface PublicEventParticipantDto {
  entityId: string;
  role: string;
  roleLabel: string | null;
  isPrimary: boolean;
}

export interface PublicEventDetailDto extends PublicEventSummaryDto {
  summary: string | null;
  /** Nội dung diễn biến dạng Block Builder (giống Lesson.content); null = chưa có, dùng `description`. */
  contentBlocks?: unknown;
  startMonth: number | null;
  startDay: number | null;
  endYear: number | null;
  endMonth: number | null;
  endDay: number | null;
  cause: string | null;
  outcome: string | null;
  sources: string[];
  participants: PublicEventParticipantDto[];
  period: PublicPeriodDto | null;
  parent: PublicEventSummaryDto | null;
  children: PublicEventSummaryDto[];
  outgoingRelations: PublicEventRelationDto[];
  incomingRelations: PublicEventRelationDto[];
  /** Danh sách statement chung (Đồ thị tri thức) — dùng để resolveTimelineBlocks() tự dựng khối AUTO/HYBRID. */
  statements: PublicEntityStatementDto[];
}

export interface PublicLessonSummaryDto {
  id: string;
  title: string;
  contentRichText: string | null;
  sourceReferenceNote: string | null;
  estimatedReadMinutes: number;
  events: PublicEventSummaryDto[];
  entities: PublicFigureDto[];
  locations: PublicLocationSummaryDto[];
}

export interface PublicChildTopicDto extends PublicTopicDto {
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicSubPeriodDto extends PublicPeriodDto {
  eventCount: number;
  figureCount: number;
}

export interface PublicPeriodDetailDto extends PublicPeriodDto {
  topics: PublicTopicDto[];
  /** Gồm cả nhân vật của các giai đoạn con và nhân vật tham gia sự kiện. */
  figures: PublicFigureDto[];
  /** Gồm cả sự kiện của các giai đoạn con. */
  events: PublicEventSummaryDto[];
  parent: PublicPeriodDto | null;
  children: PublicSubPeriodDto[];
  locations: PublicLocationSummaryDto[];
  concurrentPeriods: PublicPeriodDto[];
  concurrentEvents: PublicEventSummaryDto[];
}

export interface PublicTopicDetailDto extends PublicTopicDto {
  period: PublicPeriodDto | null;
  children: PublicChildTopicDto[];
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicFigureDetailDto extends PublicFigureDto {
  period: PublicPeriodDto | null;
  events: PublicEventSummaryDto[];
  lessons: PublicLessonSummaryDto[];
}

export interface PublicEventActorDto {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  role: string;
  roleLabel: string | null;
  startYear: number | null;
  endYear: number | null;
}

export interface PublicEventLinkDto {
  eventId: string;
  relationType: string;
  /** OUTGOING: sự kiện này → eventId · INCOMING: eventId → sự kiện này. */
  direction: 'OUTGOING' | 'INCOMING';
}

export interface PublicFigureEventDto {
  id: string;
  slug: string | null;
  title: string;
  startYear: number;
  eventDateNote: string | null;
  description: string | null;
  category: string;
  /** Id loại trong danh mục EVENT_CATEGORY (phần tử đầu là loại chính). */
  categoryIds?: string[];
  periodSlug: string | null;
  role: string;
  roleLabel: string | null;
  isPrimary: boolean;
}

export interface PublicFigureRelationDto {
  figureId: string;
  slug: string;
  name: string;
  relationType: string;
  direction: 'OUTGOING' | 'INCOMING';
  note: string | null;
  startYear: number | null;
  endYear: number | null;
}

export interface PublicFigureLegacyDto {
  hometown: string | null;
  backgroundAndYouth: string | null;
  notableWorks: string[];
  legacyAndHonors: string | null;
  anecdotes: string[];
  famousQuote: string | null;
}

export interface PublicFigureProfileDto extends PublicFigureDto {
  roles: string[];
  legacy: PublicFigureLegacyDto;
  aliases: string[];
  birthDateLabel: string | null;
  deathDateLabel: string | null;
  biography: string | null;
  /** Nội dung tường thuật dạng Block Builder (giống Lesson.content); null = chưa có, dùng `biography`. */
  contentBlocks?: unknown;
  occupation: string | null;
  titles: string[];
  sources: string[];
  periodSlug: string | null;
  events: PublicFigureEventDto[];
  relationships: PublicFigureRelationDto[];
  /** Danh sách statement chung (Đồ thị tri thức) — dùng để resolveTimelineBlocks() tự dựng khối AUTO/HYBRID. */
  statements: PublicEntityStatementDto[];
}

export interface PublicEntityMediaDto {
  id: string;
  type: string;
  url: string;
  caption: string | null;
}

export interface PublicEntityStatementDto {
  id: string;
  predicateCode: string;
  predicateLabel: string;
  direction: 'OUTGOING' | 'INCOMING';
  relatedEntityId: string | null;
  relatedEntitySlug: string | null;
  relatedEntityName: string | null;
  relatedEntityType: string | null;
  roleLabel: string | null;
  note: string | null;
  validFromYear: number | null;
  validToYear: number | null;
  /** Chỉ có khi relatedEntityType === 'EVENT' — phục vụ khối Dòng thời gian tự động (AUTO/HYBRID). */
  relatedStartYear?: number | null;
  relatedEndYear?: number | null;
  relatedDescription?: string | null;
  relatedImageUrl?: string | null;
}

export interface PublicEntityAdjacentDto {
  id: string;
  slug: string;
  name: string;
  dateLabel: string | null;
}

export interface PublicEntityDetailDto {
  id: string;
  slug: string;
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'DYNASTY' | 'MILITARY_FORCE' | 'ARTIFACT' | 'LOCATION' | 'EVENT' | string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  imageCaption: string | null;
  aliases: string[];
  dateText: string | null;
  startYear: number | null;
  endYear: number | null;
  contentBlocks?: unknown;
  metadata?: unknown;
  period: PublicPeriodDto | null;
  media: PublicEntityMediaDto[];
  statements: PublicEntityStatementDto[];
  previous?: PublicEntityAdjacentDto | null;
  next?: PublicEntityAdjacentDto | null;
  /** Chỉ có giá trị khi type === 'PERSON' (từ bảng Person). */
  roles?: string[];
  occupation?: string | null;
  titles?: string[];
  /** Chỉ có giá trị khi type === 'LOCATION' (từ bảng HistoricalSite). */
  address?: string | null;
  managingAgency?: string | null;
}
