import { ContentStatus, EventCategory, MediaType } from '@/constants/enums';
import { PaginatedResult, parsePaginatedResponse } from '../api';
import api from '../api';

export interface HistoricalEventMediaItem {
  id?: string;
  eventId?: string;
  type: MediaType;
  url: string;
  caption?: string | null;
  displayOrder?: number;
}

export interface HistoricalEventEntityItem {
  eventId?: string;
  entityId: string;
  role?: string | null;
  entity?: {
    id: string;
    name: string;
    slug?: string;
    type?: string;
  };
}

export interface HistoricalEventItem {
  id: string;
  topicId?: string | null;
  periodId?: string | null;
  locationId?: string | null;
  parentId?: string | null;
  title: string;
  slug?: string | null;
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
  status: ContentStatus;
  category?: EventCategory;
  metadata?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
  parent?: {
    id: string;
    title: string;
    slug?: string;
    startYear?: number;
  } | null;
  children?: HistoricalEventItem[];
  _count?: {
    children?: number;
  };
  topic?: {
    id: string;
    name: string;
    periodId?: string | null;
    period?: {
      id: string;
      name: string;
    } | null;
  } | null;
  period?: {
    id: string;
    name: string;
    startYear?: number;
    endYear?: number;
  } | null;
  historicalLocation?: {
    id: string;
    name: string;
    slug?: string;
    address?: string | null;
    type?: string;
  } | null;
  entities?: HistoricalEventEntityItem[];
  media?: HistoricalEventMediaItem[];
}

export interface HistoricalEventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
  periodId?: string;
  locationId?: string;
  parentId?: string;
  topLevelOnly?: boolean;
  status?: ContentStatus;
  category?: EventCategory;
  startYear?: number;
}

export interface SaveHistoricalEventPayload {
  topicId?: string;
  periodId?: string;
  locationId?: string;
  parentId?: string | null;
  title: string;
  slug?: string;
  startYear: number;
  startMonth?: number | null;
  startDay?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
  eventDateNote?: string;
  summary?: string;
  description?: string;
  category?: EventCategory;
  metadata?: Record<string, any> | null;
  thumbnailUrl?: string;
  displayOrder?: number;
  status?: ContentStatus;
  entityIds?: string[];
  entityRelations?: Array<{
    entityId: string;
    role?: string;
  }>;
  media?: Array<{
    type?: MediaType;
    url: string;
    caption?: string | null;
    displayOrder?: number;
  }>;
}

const HISTORICAL_EVENT_ENDPOINT = '/historical-events';

export const HistoricalEventApiService = {
  getEvents: async (
    params?: HistoricalEventQueryParams,
  ): Promise<PaginatedResult<HistoricalEventItem>> => {
    const response = await api.get(HISTORICAL_EVENT_ENDPOINT, { params });
    return parsePaginatedResponse<HistoricalEventItem>(response.data);
  },

  getEventById: async (id: string): Promise<HistoricalEventItem> => {
    const response = await api.get(`${HISTORICAL_EVENT_ENDPOINT}/${id}`);
    return (response.data?.data ?? response.data) as HistoricalEventItem;
  },

  createEvent: async (
    payload: SaveHistoricalEventPayload,
  ): Promise<HistoricalEventItem> => {
    const response = await api.post(HISTORICAL_EVENT_ENDPOINT, payload);
    return (response.data?.data ?? response.data) as HistoricalEventItem;
  },

  updateEvent: async (
    id: string,
    payload: Partial<SaveHistoricalEventPayload>,
  ): Promise<HistoricalEventItem> => {
    const response = await api.patch(
      `${HISTORICAL_EVENT_ENDPOINT}/${id}`,
      payload,
    );
    return (response.data?.data ?? response.data) as HistoricalEventItem;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`${HISTORICAL_EVENT_ENDPOINT}/${id}`);
  },

  addRelation: async (
    sourceEventId: string,
    payload: {
      targetEventId: string;
      relationType: string;
      description?: string;
      status?: string;
      sourceReference?: string;
    },
  ): Promise<any> => {
    const response = await api.post(
      `${HISTORICAL_EVENT_ENDPOINT}/${sourceEventId}/relations`,
      payload,
    );
    return response.data?.data ?? response.data;
  },

  removeRelation: async (relationId: string): Promise<void> => {
    await api.delete(`${HISTORICAL_EVENT_ENDPOINT}/relations/${relationId}`);
  },

  getEventGraph: async (
    eventId: string,
  ): Promise<{ nodes: any[]; edges: any[] }> => {
    const response = await api.get(
      `${HISTORICAL_EVENT_ENDPOINT}/${eventId}/graph`,
    );
    return response.data?.data ?? response.data;
  },
};

