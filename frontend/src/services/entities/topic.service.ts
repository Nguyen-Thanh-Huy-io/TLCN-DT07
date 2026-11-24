import api, { parsePaginatedResponse, type PaginatedResult } from '../api';
import { TagItem, TopicItem } from '@/types/models';
import { ContentStatus } from '@/constants/enums';
import type { ContentStatusValue } from './article.service';

export interface CreateTopicDto {
  parentId?: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface UpdateTopicDto {
  parentId?: string | null;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  isSequential?: boolean;
  displayOrder?: number;
  status?: ContentStatus;
}

export class TopicApiService {
  /**
   * Lấy danh sách Chủ đề có phân trang và lọc theo Chủ đề cha
   */
  static async getTopics(params?: {
    page?: number;
    limit?: number;
    search?: string;
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
  static async getTopicTree(): Promise<TopicItem[]> {
    const res = await api.get('/topics/tree');
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

// --- Merged from tag.service.ts ---
export const TAG_QUERY_MAX_LIMIT = 100;

export interface CreateTagDto {
  name: string;
  description?: string;
  colorHex?: string;
}

export class TagApiService {
  static async getTags(search?: string): Promise<TagItem[]> {
    const res = await api.get('/tags', {
      params: { limit: TAG_QUERY_MAX_LIMIT, search: search || undefined },
    });
    return parsePaginatedResponse<TagItem>(res.data).items;
  }

  static async createTag(dto: CreateTagDto): Promise<TagItem> {
    const res = await api.post('/tags', dto);
    return res.data?.data || res.data;
  }

  static async updateTag(id: string, dto: CreateTagDto): Promise<TagItem> {
    const res = await api.patch(`/tags/${id}`, dto);
    return res.data?.data || res.data;
  }

  static async deleteTag(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  }

  static async getLessonTags(lessonId: string): Promise<TagItem[]> {
    const res = await api.get(`/lessons/${lessonId}/tags`);
    const payload = res.data?.data ?? res.data;
    const list = Array.isArray(payload) ? payload : payload?.items || [];
    return list.map((row: TagItem & { tag?: TagItem }) => row.tag ?? row);
  }

  static async attachTagsToLesson(lessonId: string, tagIds: string[]): Promise<void> {
    await api.post(`/lessons/${lessonId}/tags`, { tagIds });
  }
}

// --- Merged from timeline.service.ts ---
export interface TimelineNodeArticleRef {
  id: string;
  title: string;
  slug: string;
  status: ContentStatusValue;
}

export interface TimelineNodeItem {
  id?: string;
  articleId: string | null;
  articleIds?: string[];
  title: string;
  description: string | null;
  imageUrl: string | null;
  dateText: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  endYear: number | null;
  displayOrder?: number;
  article?: TimelineNodeArticleRef | null;
  articles?: Array<{ article: TimelineNodeArticleRef }>;
}

export interface TimelineItem {
  id: string;
  topicId?: string | null;
  topic?: { id: string; name: string; slug: string } | null;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  displayOrder: number;
  status: ContentStatusValue;
  createdAt: string;
  updatedAt: string;
  nodes?: TimelineNodeItem[];
  _count?: { nodes: number };
}

export interface TimelinePayload {
  topicId?: string | null;
  title: string;
  slug?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  displayOrder?: number;
  status?: ContentStatusValue;
  nodes?: Array<Omit<TimelineNodeItem, 'id' | 'displayOrder' | 'article' | 'articles'>>;
}

const unwrapTimeline = <T,>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T;

export const TimelineApiService = {
  async list(query: { page?: number; limit?: number; search?: string; status?: ContentStatusValue } = {}): Promise<PaginatedResult<TimelineItem>> {
    return parsePaginatedResponse<TimelineItem>((await api.get('/timelines', { params: query })).data);
  },
  async get(id: string): Promise<TimelineItem> {
    return unwrapTimeline(await api.get(`/timelines/${id}`));
  },
  async create(payload: TimelinePayload): Promise<TimelineItem> {
    return unwrapTimeline(await api.post('/timelines', payload));
  },
  async update(id: string, payload: Partial<TimelinePayload>): Promise<TimelineItem> {
    return unwrapTimeline(await api.patch(`/timelines/${id}`, payload));
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/timelines/${id}`);
  },
};
