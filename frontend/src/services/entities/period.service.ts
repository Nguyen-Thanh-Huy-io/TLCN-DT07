import api, { parsePaginatedResponse, PaginatedResult } from '../api';
import { PeriodItem } from '@/types/models/period.type';
import { ContentStatus } from '@/constants/enums';

export interface CreatePeriodDto {
  name: string;
  region?: string;
  startYear: number;
  endYear?: number;
  description?: string;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface UpdatePeriodDto {
  name?: string;
  region?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
  displayOrder?: number;
  status?: ContentStatus;
}

export type { PaginatedResult };

export class PeriodApiService {
  /**
   * Lấy danh sách các Giai đoạn lịch sử có phân trang và tìm kiếm
   */
  static async getPeriods(params?: {
    page?: number;
    limit?: number;
    search?: string;
    region?: string;
    status?: ContentStatus;
  }): Promise<PaginatedResult<PeriodItem>> {
    const res = await api.get('/periods', { params });
    return parsePaginatedResponse<PeriodItem>(res.data);
  }

  /**
   * Lấy chi tiết một Giai đoạn theo ID
   */
  static async getPeriodById(id: string): Promise<PeriodItem> {
    const res = await api.get(`/periods/${id}`);
    return res.data?.data || res.data;
  }

  /**
   * Tạo mới một Giai đoạn
   */
  static async createPeriod(dto: CreatePeriodDto): Promise<PeriodItem> {
    const res = await api.post('/periods', dto);
    return res.data?.data || res.data;
  }

  /**
   * Cập nhật thông tin một Giai đoạn
   */
  static async updatePeriod(id: string, dto: UpdatePeriodDto): Promise<PeriodItem> {
    const res = await api.patch(`/periods/${id}`, dto);
    return res.data?.data || res.data;
  }

  /**
   * Xóa một Giai đoạn
   */
  static async deletePeriod(id: string): Promise<void> {
    await api.delete(`/periods/${id}`);
  }
}
