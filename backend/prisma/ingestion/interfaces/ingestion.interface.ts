import {
  ContentStatus,
  DatePrecision,
  EventCategory,
  EventRelationType,
  FigureRole,
  HistoricalEntityType,
  VerificationStatus,
} from '@prisma/client';
import { HistoricalDataSourceType } from '../constants/ingestion.constants';

export interface IPeriodSeedRecord {
  id: string;
  parentSlug?: string | null;
  name: string;
  slug: string;
  startYear: number | null;
  endYear: number | null;
  timeLabel: string;
  datePrecision: DatePrecision;
  region: string;
  description: string;
  coverImageUrl?: string;
  displayOrder: number;
  status: ContentStatus;
}

export interface IPersonExtensionSeed {
  birthYear?: number | null;
  deathYear?: number | null;
  birthDateLabel?: string | null;
  deathDateLabel?: string | null;
  biography: string;
  occupation?: string | null;
  titles?: string[];
  roles?: FigureRole[];
}

export interface IHistoricalSiteExtensionSeed {
  siteType: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  constructionYear?: number | null;
  constructionLabel?: string | null;
  preservationStatus?: string | null;
  recognitionLevel?: string | null;
  managingAgency?: string | null;
}

export interface IEntitySeedRecord {
  slug: string;
  periodSlug?: string;
  name: string;
  type: HistoricalEntityType;
  tagline: string;
  description: string;
  aliases: string[];
  imageUrl?: string | null;
  imageCaption?: string | null;
  metadata?: Record<string, any>;
  isFeatured: boolean;
  displayOrder: number;
  status: ContentStatus;
  person?: IPersonExtensionSeed | null;
  historicalSite?: IHistoricalSiteExtensionSeed | null;
}

export interface IEventSeedRecord {
  slug: string;
  periodSlug?: string;
  locationSlug?: string | null;
  parentSlug?: string | null;
  title: string;
  startYear: number;
  startMonth?: number | null;
  startDay?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
  eventDateNote?: string | null;
  summary: string;
  description: string;
  thumbnailUrl?: string | null;
  displayOrder: number;
  category: EventCategory;
  metadata?: Record<string, any>;
  status: ContentStatus;
}

export interface IEventEntityRelationSeed {
  eventSlug: string;
  entitySlug: string;
  role: string;
  roleLabel: string;
  isPrimary: boolean;
  displayOrder: number;
  notes?: string | null;
}

export interface IEntityGraphRelationSeed {
  sourceEntitySlug: string;
  targetEntitySlug: string;
  relationType: string;
  startYear?: number | null;
  endYear?: number | null;
  note?: string | null;
}

export interface IEventCausalRelationSeed {
  sourceEventSlug: string;
  targetEventSlug: string;
  relationType: EventRelationType;
  description: string;
  status: VerificationStatus;
  sourceReference?: string;
}

export interface IRelationsSeedDataset {
  eventEntityRelations: IEventEntityRelationSeed[];
  entityRelations: IEntityGraphRelationSeed[];
  eventCausalRelations: IEventCausalRelationSeed[];
}

export interface ICompleteHistoricalDataset {
  periods: IPeriodSeedRecord[];
  entities: IEntitySeedRecord[];
  events: IEventSeedRecord[];
  relations: IRelationsSeedDataset;
}

/**
 * Strategy Interface cho các nguồn API Lịch sử Mở (OCP / DIP)
 */
export interface IHistoricalDataSourceStrategy<TQuery = any, TResult = any> {
  readonly sourceType: HistoricalDataSourceType;
  fetchData(query: TQuery): Promise<TResult>;
}
