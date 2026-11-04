import api, { parsePaginatedResponse } from '../api';
import { TagItem } from '@/types/models/tag.type';

/** Giới hạn tối đa backend cho phép mỗi lần truy vấn (QueryTagDto @Max(100)) */
export const TAG_QUERY_MAX_LIMIT = 100;

export interface CreateTagDto {
  name: string;
  description?: string;
  colorHex?: string;
}

export class TagApiService {
  /** Lấy danh sách nhãn (có thể tìm kiếm theo tên) */
  static async getTags(search?: string): Promise<TagItem[]> {
    const res = await api.get('/tags', {
      params: { limit: TAG_QUERY_MAX_LIMIT, search: search || undefined },
    });
    return parsePaginatedResponse<TagItem>(res.data).items;
  }

  /** Tạo nhãn mới */
  static async createTag(dto: CreateTagDto): Promise<TagItem> {
    const res = await api.post('/tags', dto);
    return res.data?.data || res.data;
  }

  /** Lấy danh sách nhãn đang gắn với bài học */
  static async getLessonTags(lessonId: string): Promise<TagItem[]> {
    const res = await api.get(`/lessons/${lessonId}/tags`);
    const payload = res.data?.data ?? res.data;
    const list = Array.isArray(payload) ? payload : payload?.items || [];
    // Backend có thể trả về bản ghi pivot { tag: {...} } hoặc trực tiếp Tag
    return list.map((row: TagItem & { tag?: TagItem }) => row.tag ?? row);
  }

  /** Gắn (thay thế toàn bộ) danh sách nhãn cho bài học */
  static async attachTagsToLesson(lessonId: string, tagIds: string[]): Promise<void> {
    await api.post(`/lessons/${lessonId}/tags`, { tagIds });
  }
}
