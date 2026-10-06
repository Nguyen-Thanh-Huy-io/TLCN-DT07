import api, { parsePaginatedResponse } from '../api';
import { TopicItem } from '@/types/models/topic.type';
import { ContentStatus, LearningPathType } from '@/constants/enums';
import { PaginatedResult } from '../api';

export interface CreateTopicDto {
  periodId?: string;
  parentId?: string;
  pathType?: LearningPathType;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface UpdateTopicDto {
  periodId?: string | null;
  parentId?: string | null;
  pathType?: LearningPathType;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
}

export class TopicApiService {
  /**
   * Lấy danh sách Chủ đề có phân trang và lọc theo Giai đoạn / Chủ đề cha
   */
  static async getTopics(params?: {
    page?: number;
    limit?: number;
    search?: string;
    periodId?: string;
    parentId?: string;
    isRootOnly?: boolean;
    status?: ContentStatus;
  }): Promise<PaginatedResult<TopicItem>> {
    const res = await api.get('/topics', { params });
    return parsePaginatedResponse<TopicItem>(res.data);
  }

  /**
   * Lấy cấu trúc Cây Tri thức phân cấp (Composite Tree) của các chủ đề
   */
  static async getTopicTree(periodId?: string): Promise<TopicItem[]> {
    const res = await api.get('/topics/tree', { params: { periodId } });
    return res.data?.data || res.data || [];
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

  /**
   * Gắn danh sách chủ đề con vào một chủ đề cha
   */
  static async assignChildren(
    parentId: string,
    childIds: string[],
  ): Promise<{ count: number; message: string }> {
    const res = await api.post(`/topics/${parentId}/children`, { childIds });
    return res.data?.data || res.data;
  }

  /**
   * Tách một chủ đề con khỏi chủ đề cha để trở thành chủ đề gốc độc lập
   */
  static async removeChild(
    parentId: string,
    childId: string,
  ): Promise<{ message: string }> {
    const res = await api.delete(`/topics/${parentId}/children/${childId}`);
    return res.data?.data || res.data;
  }

  /**
   * Sắp xếp lại thứ tự hiển thị của các chủ đề (Batch Reordering)
   */
  static async reorderTopics(
    items: { id: string; displayOrder: number }[],
  ): Promise<{ count: number; message: string }> {
    const res = await api.patch('/topics/reorder', { items });
    return res.data?.data || res.data;
  }
}
