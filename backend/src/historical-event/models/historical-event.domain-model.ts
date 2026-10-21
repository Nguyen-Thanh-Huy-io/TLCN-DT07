export interface CreateHistoricalEventDomainModel {
  title: string;
  slug: string;
  startYear: number;
  startMonth?: number | null;
  startDay?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
  eventDateNote?: string | null;
  summary?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  displayOrder?: number;
  status?: string;
  category?: string;
  metadata?: Record<string, any> | null;
  topicId?: string | null;
  periodId?: string | null;
  locationId?: string | null;
  parentId?: string | null;
  entities?: Array<{
    entityId: string;
    role?: string;
    roleLabel?: string | null;
    isPrimary?: boolean;
    displayOrder?: number;
    notes?: string | null;
  }>;
  media?: Array<{
    type?: string;
    url: string;
    caption?: string | null;
    displayOrder?: number;
  }>;
}

export interface UpdateHistoricalEventDomainModel {
  title?: string;
  slug?: string;
  startYear?: number;
  startMonth?: number | null;
  startDay?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
  eventDateNote?: string | null;
  summary?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  displayOrder?: number;
  status?: string;
  category?: string;
  metadata?: Record<string, any> | null;
  topicId?: string | null;
  periodId?: string | null;
  locationId?: string | null;
  parentId?: string | null;
  entities?: Array<{
    entityId: string;
    role?: string;
    roleLabel?: string | null;
    isPrimary?: boolean;
    displayOrder?: number;
    notes?: string | null;
  }>;
  media?: Array<{
    type?: string;
    url: string;
    caption?: string | null;
    displayOrder?: number;
  }>;
}

export interface HistoricalEventEntityModel {
  id: string;
  title: string;
  slug: string;
  startYear: number;
  startMonth?: number | null;
  startDay?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
  eventDateNote?: string | null;
  summary?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  displayOrder: number;
  status: string;
  category: string;
  metadata?: Record<string, any> | null;
  topicId?: string | null;
  periodId?: string | null;
  siteId?: string | null;
  locationId?: string | null;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  topic?: any;
  period?: any;
  site?: any;
  location?: any;
  historicalLocation?: any;
  parent?: any;
  children?: any[];
  entities?: any[];
  media?: any[];
  _count?: { children: number };
}
