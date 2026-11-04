import {
  ContentStatus,
  EntityRelationType,
  EntityType,
  MediaType,
} from '@/constants/enums';
import { PaginatedResult, parsePaginatedResponse } from '../api';
import api from '../api';
import {
  HistoricalEntityItem,
  HistoricalEntityMediaItem,
  HistoricalEntityRelationItem,
} from '@/types/models/historical-entity.type';
import { PersonTimelineResponse } from '@/types/models/person-timeline.type';

export interface HistoricalEntityQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: EntityType;
  status?: ContentStatus;
  periodId?: string;
}

export interface SaveHistoricalEntityPayload {
  periodId?: string | null;
  periodIds?: string[];
  name: string;
  type?: EntityType;
  tagline?: string | null;
  description?: string | null;
  /** Nội dung tường thuật dạng Block Builder (giống Lesson.content); dùng chung mọi loại thực thể. */
  contentBlocks?: unknown;
  aliases?: string[];
  imageUrl?: string | null;
  imageCaption?: string | null;
  birthYear?: number | null;
  /** Năm tồn tại — triều đại / quốc gia / chính thể, tổ chức, lực lượng. */
  startYear?: number | null;
  endYear?: number | null;
  deathYear?: number | null;
  birthDateLabel?: string | null;
  deathDateLabel?: string | null;
  // Person fields (cho PERSON)
  /** Mã vai trò (danh mục FIGURE_ROLE). */
  roles?: string[];
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
  metadata?: Record<string, any> | null;
  isFeatured?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface SaveEntityRelationPayload {
  targetEntityId: string;
  relationType: EntityRelationType | string;
  startYear?: number | null;
  endYear?: number | null;
  note?: string | null;
}

export interface SaveEntityMediaPayload {
  type: MediaType;
  url: string;
  caption?: string | null;
  displayOrder?: number;
}

export interface EntityGraphData {
  nodes: Array<{
    id: string;
    name: string;
    type: EntityType;
    imageUrl?: string | null;
    birthYear?: number | null;
    deathYear?: number | null;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    relationType: string;
    startYear?: number | null;
    endYear?: number | null;
    note?: string | null;
  }>;
}

const HISTORICAL_ENTITY_ENDPOINT = '/historical-entities';

export const HistoricalEntityApiService = {
  getEntities: async (
    params?: HistoricalEntityQueryParams,
  ): Promise<PaginatedResult<HistoricalEntityItem>> => {
    const response = await api.get(HISTORICAL_ENTITY_ENDPOINT, { params });
    return parsePaginatedResponse<HistoricalEntityItem>(response.data);
  },

  getEntityById: async (id: string): Promise<HistoricalEntityItem> => {
    const response = await api.get(`${HISTORICAL_ENTITY_ENDPOINT}/${id}`);
    const resolved = response.data?.data ?? response.data;
    if (!resolved || typeof resolved !== 'object' || Array.isArray(resolved)) {
      throw new Error(`Không tìm thấy thực thể lịch sử với mã: ${id}`);
    }
    return resolved as HistoricalEntityItem;
  },

  createEntity: async (
    payload: SaveHistoricalEntityPayload,
  ): Promise<HistoricalEntityItem> => {
    const response = await api.post(HISTORICAL_ENTITY_ENDPOINT, payload);
    return (response.data?.data ?? response.data) as HistoricalEntityItem;
  },

  updateEntity: async (
    id: string,
    payload: Partial<SaveHistoricalEntityPayload>,
  ): Promise<HistoricalEntityItem> => {
    const response = await api.patch(
      `${HISTORICAL_ENTITY_ENDPOINT}/${id}`,
      payload,
    );
    return (response.data?.data ?? response.data) as HistoricalEntityItem;
  },

  deleteEntity: async (id: string): Promise<void> => {
    await api.delete(`${HISTORICAL_ENTITY_ENDPOINT}/${id}`);
  },

  // Quan hệ hồi quy N-N
  addRelation: async (
    sourceId: string,
    payload: SaveEntityRelationPayload,
  ): Promise<HistoricalEntityRelationItem> => {
    const response = await api.post(
      `${HISTORICAL_ENTITY_ENDPOINT}/${sourceId}/relations`,
      payload,
    );
    return (response.data?.data ?? response.data) as HistoricalEntityRelationItem;
  },

  removeRelation: async (
    sourceId: string,
    relationId: string,
  ): Promise<void> => {
    await api.delete(
      `${HISTORICAL_ENTITY_ENDPOINT}/${sourceId}/relations/${relationId}`,
    );
  },

  getEntityGraph: async (id: string): Promise<EntityGraphData> => {
    const response = await api.get(
      `${HISTORICAL_ENTITY_ENDPOINT}/${id}/graph`,
    );
    return (response.data?.data ?? response.data) as EntityGraphData;
  },

  getTimeline: async (
    id: string,
    params?: { order?: 'asc' | 'desc'; includeStatements?: boolean },
  ): Promise<PersonTimelineResponse> => {
    const response = await api.get(
      `${HISTORICAL_ENTITY_ENDPOINT}/${id}/timeline`,
      { params },
    );
    return (response.data?.data ?? response.data) as PersonTimelineResponse;
  },

  // Media
  addMedia: async (
    entityId: string,
    payload: SaveEntityMediaPayload,
  ): Promise<HistoricalEntityMediaItem> => {
    const response = await api.post(
      `${HISTORICAL_ENTITY_ENDPOINT}/${entityId}/media`,
      payload,
    );
    return (response.data?.data ?? response.data) as HistoricalEntityMediaItem;
  },

  removeMedia: async (
    entityId: string,
    mediaId: string,
  ): Promise<void> => {
    await api.delete(
      `${HISTORICAL_ENTITY_ENDPOINT}/${entityId}/media/${mediaId}`,
    );
  },
};
