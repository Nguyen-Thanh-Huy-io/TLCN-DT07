import {
  ContentStatus,
  DatePrecision,
  EntityRelationType,
  EntityType,
  MediaType,
} from '@/constants/enums';

export interface HistoricalEntityMediaItem {
  id?: string;
  entityId?: string;
  type: MediaType;
  url: string;
  caption?: string | null;
  displayOrder?: number;
  createdAt?: string;
}

export interface HistoricalEntityRelationItem {
  id?: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: EntityRelationType | string;
  startYear?: number | null;
  endYear?: number | null;
  note?: string | null;
  createdAt?: string;
  targetEntity?: Partial<HistoricalEntityItem>;
  sourceEntity?: Partial<HistoricalEntityItem>;
}

export interface HistoricalEntityItem {
  id: string;
  periodId?: string | null;
  periodIds?: string[];
  name: string;
  slug?: string;
  type: EntityType;
  tagline?: string | null;
  description?: string | null;
  /** Nội dung tường thuật dạng Block Builder (giống Lesson.content); null/undefined = chưa có, dùng `description`. */
  contentBlocks?: unknown;
  aliases?: string[];
  imageUrl?: string | null;
  imageCaption?: string | null;
  /** Thời gian tồn tại — triều đại / quốc gia / chính thể, tổ chức, lực lượng. */
  dateText?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  datePrecision?: DatePrecision | null;
  // Person fields (tách riêng nhóm trường Ngày sinh & Ngày mất cho PERSON)
  birthDateText?: string | null;
  birthYear?: number | null;
  birthMonth?: number | null;
  birthDay?: number | null;
  birthPrecision?: DatePrecision | null;
  deathDateText?: string | null;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  deathPrecision?: DatePrecision | null;
  birthDateLabel?: string | null;
  deathDateLabel?: string | null;
  occupation?: string | null;
  titles?: string[];
  /** Mã vai trò (danh mục FIGURE_ROLE). */
  roles?: string[];
  biography?: string | null;
  // Historical Site fields (cho LOCATION / Di tích)
  siteType?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  constructionDateText?: string | null;
  constructionYear?: number | null;
  constructionMonth?: number | null;
  constructionDay?: number | null;
  constructionEndYear?: number | null;
  constructionLabel?: string | null;
  preservationStatus?: string | null;
  recognitionLevel?: string | null;
  managingAgency?: string | null;
  statusNote?: string | null;
  /** Mã danh mục dùng chung đã gắn (loại, hiện trạng, xếp hạng) — để form CMS chọn sẵn. */
  siteTypeCode?: string | null;
  preservationCode?: string | null;
  rankCode?: string | null;
  metadata?: Record<string, any> | null;
  isFeatured?: boolean;
  displayOrder?: number;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
  period?: {
    id: string;
    name: string;
    startYear?: number;
    endYear?: number;
  } | null;
  periods?: Array<{
    id: string;
    name: string;
    startYear?: number;
    endYear?: number;
  }>;
  outgoingRelations?: HistoricalEntityRelationItem[];
  incomingRelations?: HistoricalEntityRelationItem[];
  media?: HistoricalEntityMediaItem[];
  eventEntities?: Array<{
    eventId: string;
    entityId: string;
    role: string;
    roleLabel?: string | null;
    isPrimary?: boolean;
    displayOrder?: number;
    notes?: string | null;
    event?: {
      id: string;
      title: string;
      slug: string;
      startYear?: number | null;
      endYear?: number | null;
      category?: string;
      thumbnailUrl?: string | null;
    };
  }>;
  eventParticipations?: HistoricalEventParticipantItem[];
  primaryEvents?: Array<{
    id: string;
    title: string;
    slug: string;
    startYear?: number | null;
    endYear?: number | null;
    category?: string;
    thumbnailUrl?: string | null;
  }>;
}

export interface HistoricalEventParticipantItem {
  id: string;
  eventId: string;
  entityId: string;
  roleTermId?: string | null;
  roleLabelOverride?: string | null;
  isPrimary: boolean;
  displayOrder: number;
  startYear?: number | null;
  endYear?: number | null;
  notes?: string | null;
  roleTerm?: {
    id: string;
    code: string;
    label: string;
  } | null;
  event?: {
    id: string;
    title: string;
    slug: string;
    startYear?: number | null;
    endYear?: number | null;
    category?: string;
    thumbnailUrl?: string | null;
  } | null;
  entity?: Partial<HistoricalEntityItem> | null;
  references?: Array<{
    id: string;
    referenceId: string;
    pageNumber?: string | null;
    chapter?: string | null;
    quote?: string | null;
    note?: string | null;
    reference?: {
      id: string;
      title: string;
      author?: string | null;
    };
  }>;
  createdAt?: string;
  updatedAt?: string;
}
