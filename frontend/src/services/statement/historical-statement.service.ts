import api, { PaginatedResult, parsePaginatedResponse } from '../api';
import {
  CreateHistoricalStatementPayload,
  HistoricalStatementItem,
  StatementGraphData,
} from '@/types/models/historical-statement.type';

export interface QueryStatementParams {
  page?: number;
  limit?: number;
  subjectId?: string;
  objectId?: string;
  nodeId?: string;
  predicateId?: string;
  predicateCode?: string;
  isPrimary?: boolean;
  year?: number;
}

export interface QueryGraphParams {
  nodeId: string;
  depth?: number;
  includeLiterals?: boolean;
}

export const historicalStatementService = {
  /**
   * Lấy danh sách phát biểu (phân trang & lọc)
   */
  async getStatements(
    params?: QueryStatementParams,
  ): Promise<PaginatedResult<HistoricalStatementItem>> {
    const res = await api.get('/historical-statements', { params });
    return parsePaginatedResponse<HistoricalStatementItem>(res.data);
  },

  /**
   * Lấy chi tiết phát biểu
   */
  async getStatementById(id: string): Promise<HistoricalStatementItem> {
    const res = await api.get(`/historical-statements/${id}`);
    return res.data;
  },

  /**
   * Tạo phát biểu mới
   */
  async createStatement(
    payload: CreateHistoricalStatementPayload,
  ): Promise<HistoricalStatementItem> {
    const res = await api.post('/historical-statements', payload);
    return res.data;
  },

  /**
   * Cập nhật phát biểu
   */
  async updateStatement(
    id: string,
    payload: Partial<CreateHistoricalStatementPayload>,
  ): Promise<HistoricalStatementItem> {
    const res = await api.patch(`/historical-statements/${id}`, payload);
    return res.data;
  },

  /**
   * Xoá phát biểu
   */
  async deleteStatement(id: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/historical-statements/${id}`);
    return res.data;
  },

  /**
   * Lấy dữ liệu đồ thị tri thức đa tầng (Nodes & Edges)
   */
  async getGraph(params: QueryGraphParams): Promise<StatementGraphData> {
    const res = await api.get('/historical-statements/graph', { params });
    return res.data;
  },
};
