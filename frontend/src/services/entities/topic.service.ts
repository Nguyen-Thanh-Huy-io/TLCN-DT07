import api, { parsePaginatedResponse } from '../api';
import { TopicItem } from '@/types/models/topic.type';
import { ContentStatus } from '@/constants/enums';
import { PaginatedResult } from '../api';

export interface CreateTopicDto {
  periodId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface UpdateTopicDto {
  periodId?: string;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
}

export class TopicApiService {
  /**
   * Lấy danh sách Chủ đề có phân trang và lọc theo Giai đoạn
   */
  static async getTopics(params?: {
    page?: number;
    limit?: number;
    search?: string;
    periodId?: string;
    status?: ContentStatus;
  }): Promise<PaginatedResult<TopicItem>> {
    const res = await api.get('/topics', { params });
    return parsePaginatedResponse<TopicItem>(res.data);
  }

  /**
   * Lấy chi tiết một Chủ đề theo ID
   */
  static async getTopicById(id: string): Promise<TopicItem> {
    const res = await api.get(`/topics/${id}`);
    return res.data?.data || res.data;
  }

  /**
   * Tạo mới một Chủ đề
   */
  static async createTopic(dto: CreateTopicDto): Promise<TopicItem> {
    const res = await api.post('/topics', dto);
    return res.data?.data || res.data;
  }

  /**
   * Cập nhật thông tin một Chủ đề
   */
  static async updateTopic(id: string, dto: UpdateTopicDto): Promise<TopicItem> {
    const res = await api.patch(`/topics/${id}`, dto);
    return res.data?.data || res.data;
  }

  /**
   * Xóa một Chủ đề
   */
  static async deleteTopic(id: string): Promise<void> {
    await api.delete(`/topics/${id}`);
  }
}
