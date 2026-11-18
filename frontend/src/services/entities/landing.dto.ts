
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
  topicId?: string | null;
}

export interface PublicLocationSummaryDto {
  id: string;
  slug: string;
  name: string;
  address: string | null;
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
  /** Năm / văn bản công nhận di tích (chữ tự do) — chỉ hiển thị. */
  recognizedYear?: string | null;
  /** Phong cách kiến trúc (chữ tự do) — chỉ hiển thị. */
  architecturalStyle?: string | null;
  /** Mức độ "trải nghiệm số" có sẵn của di tích. */
  digital?: {
    hasImage: boolean;
    galleryCount: number;
    hasThenAndNow: boolean;
    hasChronicle: boolean;
    hasStructures: boolean;
  };
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
  /** Quan hệ với sự kiện khác đã khai báo trực tiếp (ArticleLink). */
  relations?: PublicEventLinkDto[];
  periodSlug: string | null;
  topicId?: string | null;
  figures: PublicFigureDto[];
  locations: PublicLocationSummaryDto[];
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
  biography: string | null;
  /** Nội dung tường thuật dạng Block Builder (giống Lesson.content); null = chưa có, dùng `biography`. */
  contentBlocks?: unknown;
  titles: string[];
  sources: string[];
  periodSlug: string | null;
  events: PublicFigureEventDto[];
  relationships: PublicFigureRelationDto[];
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
  /** Nhãn liên kết do người soạn ghi; null = chưa ghi nhãn (predicateLabel khi đó là "Liên quan"). */
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

/** Bài viết cùng tag với bài đang đọc — tách riêng khỏi "Mạng lưới tri thức" (chỉ chứa liên kết khai báo). */
export interface PublicEntityRelatedArticleDto {
  id: string;
  slug: string;
  name: string;
  type: string;
  categoryName: string | null;
  summary: string | null;
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
  /** Chỉ gồm các liên kết bài ↔ bài khai báo trực tiếp (ArticleLink, 2 chiều). */
  statements: PublicEntityStatementDto[];
  /** Các bài viết chia sẻ cùng tag (không trùng với statements). */
  relatedByTag?: PublicEntityRelatedArticleDto[];
  previous?: PublicEntityAdjacentDto | null;
  next?: PublicEntityAdjacentDto | null;
  /** Bài trước / sau lấy theo Dòng thời gian này; null = cùng chuyên mục theo năm. */
  adjacentTimeline?: { slug: string; title: string } | null;
  /** Chỉ có giá trị khi type === 'PERSON' (từ bảng Person). */
  roles?: string[];
  titles?: string[];
  /** Chỉ có giá trị khi type === 'LOCATION' (từ bảng HistoricalSite). */
  address?: string | null;
  managingAgency?: string | null;
  siteTypeLabel?: string | null;
  statusNote?: string | null;
}

export interface PublicArticleLibraryItemDto {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  startYear: number | null;
  endYear: number | null;
  dateLabel: string | null;
  kind: string;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  periodSlug: string | null;
  topicId: string | null;
  aliases: string[];
  tags: Array<{ id: string; name: string }>;
  address: string | null;
  siteType: string | null;
  siteTypeLabel: string | null;
  preservationCategory: string | null;
  recognizedYear: string | null;
  roles: string[];
  titles: string[];
  hometown: string | null;
  famousQuote: string | null;
  linkedEventsCount: number;
  linkedFigureNames: string[];
  linkedLocationNames: string[];
}
