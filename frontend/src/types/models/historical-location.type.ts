import { ContentStatus, EntityType, LocationType } from '@/constants/enums';

export interface HistoricalSiteData {
  entityId?: string;
  siteType?: LocationType | string;
  address?: string;
  latitude?: number;
  longitude?: number;
  constructionYear?: number;
  constructionLabel?: string;
  preservationStatus?: string;
  recognitionLevel?: string;
  managingAgency?: string;
}

export interface HistoricalLocationItem {
  id: string;
  slug?: string;
  name: string;
  type?: EntityType | LocationType;
  tagline?: string;
  description?: string;
  aliases?: string[];
  historicalNames?: string[];
  imageUrl?: string;
  imageCaption?: string;
  // Các trường đặc thù của HistoricalSite (hỗ trợ cả dạng phẳng và lồng)
  siteType?: LocationType | string;
  address?: string;
  latitude?: number;
  longitude?: number;
  historicalSignificance?: string;
  historicalSite?: HistoricalSiteData;
  status: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
}

