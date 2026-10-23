import {
  ContentStatus,
  EntityRelationType,
  EntityType,
  FigureRole,
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
  aliases?: string[];
  imageUrl?: string | null;
  imageCaption?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  birthDateLabel?: string | null;
  deathDateLabel?: string | null;
  // Person fields (cho PERSON)
  occupation?: string | null;
  titles?: string[];
  roles?: FigureRole[];
  biography?: string | null;
  // Historical Site fields (cho LOCATION)
  siteType?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  constructionYear?: number | null;
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
