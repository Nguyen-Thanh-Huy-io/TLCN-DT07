import api, { PaginatedResult, parsePaginatedResponse } from '../api';
import {
  CreateHistoricalReferencePayload,
  HistoricalReferenceItem,
} from '@/types/models/historical-reference.type';

export interface QueryReferenceParams {
  page?: number;
  limit?: number;
  search?: string;
  author?: string;
  publishYear?: number;
}

export const historicalReferenceService = {
  async getReferences(
    params?: QueryReferenceParams,
  ): Promise<PaginatedResult<HistoricalReferenceItem>> {
    const res = await api.get('/historical-references', { params });
    return parsePaginatedResponse<HistoricalReferenceItem>(res.data);
  },

  async getReferenceById(id: string): Promise<HistoricalReferenceItem> {
    const res = await api.get(`/historical-references/${id}`);
    return res.data;
  },

  async createReference(
    payload: CreateHistoricalReferencePayload,
  ): Promise<HistoricalReferenceItem> {
    const res = await api.post('/historical-references', payload);
    return res.data;
  },

  async updateReference(
    id: string,
    payload: Partial<CreateHistoricalReferencePayload>,
  ): Promise<HistoricalReferenceItem> {
    const res = await api.patch(`/historical-references/${id}`, payload);
    return res.data;
  },

  async deleteReference(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/historical-references/${id}`);
    return res.data;
  },
};
